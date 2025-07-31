// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title LunacoinBridge
 * @dev Cross-chain bridge contract for LUNACOIN token
 * Supports bridging between Solana, Ethereum, BSC, and Polygon
 */
contract LunacoinBridge is ERC20, ERC20Burnable, Pausable, AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;

    // Roles
    bytes32 public constant BRIDGE_OPERATOR_ROLE = keccak256("BRIDGE_OPERATOR_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Bridge configuration
    struct BridgeConfig {
        uint256 minAmount;
        uint256 maxAmount;
        uint256 fee;
        bool enabled;
    }

    // Bridge transaction
    struct BridgeTransaction {
        bytes32 txHash;
        address user;
        uint256 amount;
        uint256 fee;
        string targetChain;
        string targetAddress;
        uint256 timestamp;
        bool processed;
        bool completed;
    }

    // Chain configurations
    mapping(string => BridgeConfig) public chainConfigs;
    
    // Bridge transactions
    mapping(bytes32 => BridgeTransaction) public bridgeTransactions;
    mapping(address => bytes32[]) public userTransactions;
    
    // Validators
    mapping(address => bool) public validators;
    uint256 public requiredValidators = 3;
    
    // Transaction confirmations
    mapping(bytes32 => mapping(address => bool)) public confirmations;
    mapping(bytes32 => uint256) public confirmationCount;
    
    // Statistics
    uint256 public totalBridged;
    uint256 public totalFees;
    mapping(string => uint256) public chainVolume;
    
    // Events
    event BridgeInitiated(
        bytes32 indexed txHash,
        address indexed user,
        uint256 amount,
        string targetChain,
        string targetAddress
    );
    
    event BridgeCompleted(
        bytes32 indexed txHash,
        address indexed user,
        uint256 amount,
        string sourceChain
    );
    
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event ChainConfigUpdated(string chain, BridgeConfig config);
    event FeesWithdrawn(address indexed to, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_OPERATOR_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        _mint(msg.sender, initialSupply * 10**decimals());
        
        // Initialize default chain configurations
        _initializeChainConfigs();
    }

    /**
     * @dev Initialize default chain configurations
     */
    function _initializeChainConfigs() private {
        // Solana
        chainConfigs["solana"] = BridgeConfig({
            minAmount: 1 * 10**decimals(),
            maxAmount: 1000000 * 10**decimals(),
            fee: 1 * 10**(decimals()-2), // 0.01 LUNA
            enabled: true
        });
        
        // Ethereum
        chainConfigs["ethereum"] = BridgeConfig({
            minAmount: 10 * 10**decimals(),
            maxAmount: 500000 * 10**decimals(),
            fee: 5 * 10**(decimals()-2), // 0.05 LUNA
            enabled: true
        });
        
        // BSC
        chainConfigs["bsc"] = BridgeConfig({
            minAmount: 1 * 10**decimals(),
            maxAmount: 1000000 * 10**decimals(),
            fee: 1 * 10**(decimals()-2), // 0.01 LUNA
            enabled: true
        });
        
        // Polygon
        chainConfigs["polygon"] = BridgeConfig({
            minAmount: 1 * 10**decimals(),
            maxAmount: 1000000 * 10**decimals(),
            fee: 1 * 10**(decimals()-3), // 0.001 LUNA
            enabled: true
        });
    }

    /**
     * @dev Initiate bridge transaction to another chain
     */
    function initiateBridge(
        uint256 amount,
        string memory targetChain,
        string memory targetAddress
    ) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(targetChain).length > 0, "Target chain required");
        require(bytes(targetAddress).length > 0, "Target address required");
        
        BridgeConfig memory config = chainConfigs[targetChain];
        require(config.enabled, "Target chain not supported");
        require(amount >= config.minAmount, "Amount below minimum");
        require(amount <= config.maxAmount, "Amount exceeds maximum");
        
        uint256 totalAmount = amount + config.fee;
        require(balanceOf(msg.sender) >= totalAmount, "Insufficient balance");
        
        // Generate transaction hash
        bytes32 txHash = keccak256(
            abi.encodePacked(
                msg.sender,
                amount,
                targetChain,
                targetAddress,
                block.timestamp,
                block.number
            )
        );
        
        // Burn tokens (lock mechanism)
        _burn(msg.sender, amount);
        
        // Collect fee
        if (config.fee > 0) {
            _transfer(msg.sender, address(this), config.fee);
            totalFees += config.fee;
        }
        
        // Store transaction
        bridgeTransactions[txHash] = BridgeTransaction({
            txHash: txHash,
            user: msg.sender,
            amount: amount,
            fee: config.fee,
            targetChain: targetChain,
            targetAddress: targetAddress,
            timestamp: block.timestamp,
            processed: false,
            completed: false
        });
        
        userTransactions[msg.sender].push(txHash);
        
        // Update statistics
        totalBridged += amount;
        chainVolume[targetChain] += amount;
        
        emit BridgeInitiated(txHash, msg.sender, amount, targetChain, targetAddress);
    }

    /**
     * @dev Complete bridge transaction from another chain
     */
    function completeBridge(
        bytes32 txHash,
        address user,
        uint256 amount,
        string memory sourceChain,
        bytes[] memory signatures
    ) external onlyRole(BRIDGE_OPERATOR_ROLE) nonReentrant whenNotPaused {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        require(signatures.length >= requiredValidators, "Insufficient signatures");
        
        // Verify transaction hasn't been processed
        require(!bridgeTransactions[txHash].processed, "Transaction already processed");
        
        // Verify signatures
        bytes32 messageHash = keccak256(
            abi.encodePacked(txHash, user, amount, sourceChain)
        );
        
        _verifySignatures(messageHash, signatures);
        
        // Mint tokens to user
        _mint(user, amount);
        
        // Mark as processed
        bridgeTransactions[txHash].processed = true;
        bridgeTransactions[txHash].completed = true;
        
        // Update statistics
        chainVolume[sourceChain] += amount;
        
        emit BridgeCompleted(txHash, user, amount, sourceChain);
    }

    /**
     * @dev Verify validator signatures
     */
    function _verifySignatures(
        bytes32 messageHash,
        bytes[] memory signatures
    ) private view {
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address[] memory signers = new address[](signatures.length);
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ethSignedMessageHash.recover(signatures[i]);
            require(validators[signer], "Invalid validator signature");
            
            // Check for duplicate signers
            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signature");
            }
            
            signers[i] = signer;
        }
    }

    /**
     * @dev Add validator
     */
    function addValidator(address validator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(validator != address(0), "Invalid validator address");
        require(!validators[validator], "Validator already exists");
        
        validators[validator] = true;
        _grantRole(VALIDATOR_ROLE, validator);
        
        emit ValidatorAdded(validator);
    }

    /**
     * @dev Remove validator
     */
    function removeValidator(address validator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(validators[validator], "Validator does not exist");
        
        validators[validator] = false;
        _revokeRole(VALIDATOR_ROLE, validator);
        
        emit ValidatorRemoved(validator);
    }

    /**
     * @dev Update chain configuration
     */
    function updateChainConfig(
        string memory chain,
        BridgeConfig memory config
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(chain).length > 0, "Chain name required");
        require(config.minAmount > 0, "Invalid minimum amount");
        require(config.maxAmount > config.minAmount, "Invalid maximum amount");
        
        chainConfigs[chain] = config;
        
        emit ChainConfigUpdated(chain, config);
    }

    /**
     * @dev Set required validators count
     */
    function setRequiredValidators(uint256 count) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(count > 0, "Count must be greater than 0");
        requiredValidators = count;
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees(address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "Invalid recipient");
        require(amount <= balanceOf(address(this)), "Insufficient contract balance");
        
        _transfer(address(this), to, amount);
        
        emit FeesWithdrawn(to, amount);
    }

    /**
     * @dev Get user transactions
     */
    function getUserTransactions(address user) external view returns (bytes32[] memory) {
        return userTransactions[user];
    }

    /**
     * @dev Get bridge statistics
     */
    function getBridgeStats() external view returns (
        uint256 _totalBridged,
        uint256 _totalFees,
        uint256 _contractBalance
    ) {
        return (totalBridged, totalFees, balanceOf(address(this)));
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal (only admin)
     */
    function emergencyWithdraw(address token, address to, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        if (token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).transfer(to, amount);
        }
    }

    // Override required by Solidity
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    // Support for receiving ETH
    receive() external payable {}
}