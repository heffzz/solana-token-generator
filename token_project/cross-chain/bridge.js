const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Web3 = require('web3');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const winston = require('winston');
const cron = require('node-cron');
const { config, validateConfig, getNetworkConfig, getBridgeFee, isNetworkEnabled } = require('./config/bridge.config');

// Initialize logger
const logger = winston.createLogger({
  level: config.bridge.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: config.bridge.logging.file.path,
      maxsize: config.bridge.logging.file.maxSize,
      maxFiles: config.bridge.logging.file.maxFiles
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Database schemas
const bridgeTransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  fromNetwork: { type: String, required: true },
  toNetwork: { type: String, required: true },
  fromAddress: { type: String, required: true },
  toAddress: { type: String, required: true },
  amount: { type: String, required: true },
  fee: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  fromTxHash: String,
  toTxHash: String,
  blockNumber: Number,
  confirmations: { type: Number, default: 0 },
  validations: [{
    validator: String,
    signature: String,
    timestamp: Date
  }],
  express: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date,
  errorMessage: String,
  retryCount: { type: Number, default: 0 }
});

const validatorSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  publicKey: { type: String, required: true },
  network: { type: String, required: true },
  stake: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  reputation: { type: Number, default: 100 },
  totalValidations: { type: Number, default: 0 },
  successfulValidations: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
  slashEvents: [{
    amount: String,
    reason: String,
    timestamp: Date
  }]
});

const bridgeStatsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  network: { type: String, required: true },
  totalVolume: { type: String, default: '0' },
  totalTransactions: { type: Number, default: 0 },
  totalFees: { type: String, default: '0' },
  averageTime: { type: Number, default: 0 },
  successRate: { type: Number, default: 100 }
});

const BridgeTransaction = mongoose.model('BridgeTransaction', bridgeTransactionSchema);
const Validator = mongoose.model('Validator', validatorSchema);
const BridgeStats = mongoose.model('BridgeStats', bridgeStatsSchema);

class LunacoinBridge {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.bridge.api.cors.origin,
        credentials: config.bridge.api.cors.credentials
      }
    });
    
    this.connections = new Map();
    this.validators = new Map();
    this.pendingTransactions = new Map();
    this.networkStats = new Map();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeNetworks();
    this.startBackgroundTasks();
  }
  
  initializeMiddleware() {
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors(config.bridge.api.cors));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Rate limiting
    const limiter = rateLimit(config.bridge.api.rateLimit);
    this.app.use('/api/', limiter);
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }
  
  initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        networks: this.getNetworkStatus()
      });
    });
    
    // Bridge information
    this.app.get('/api/bridge/info', (req, res) => {
      res.json({
        success: true,
        data: {
          networks: Object.keys(config.networks).filter(isNetworkEnabled),
          limits: config.bridge.limits,
          fees: config.bridge.fees,
          validators: {
            required: config.bridge.validators.required,
            active: this.validators.size
          }
        }
      });
    });
    
    // Get bridge fee estimate
    this.app.post('/api/bridge/fee', async (req, res) => {
      try {
        const { fromNetwork, toNetwork, amount, express = false } = req.body;
        
        if (!isNetworkEnabled(fromNetwork) || !isNetworkEnabled(toNetwork)) {
          return res.status(400).json({
            success: false,
            error: 'Network not supported'
          });
        }
        
        const fee = getBridgeFee(fromNetwork, toNetwork, amount, express);
        const estimatedTime = express ? '5-10 minutes' : '15-30 minutes';
        
        res.json({
          success: true,
          data: {
            fee: fee.toString(),
            estimatedTime,
            express
          }
        });
      } catch (error) {
        logger.error('Fee estimation error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to estimate fee'
        });
      }
    });
    
    // Initiate bridge transaction
    this.app.post('/api/bridge/initiate', async (req, res) => {
      try {
        const {
          fromNetwork,
          toNetwork,
          fromAddress,
          toAddress,
          amount,
          express = false
        } = req.body;
        
        // Validate inputs
        const validation = await this.validateBridgeRequest(req.body);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: validation.error
          });
        }
        
        // Create bridge transaction
        const transaction = await this.createBridgeTransaction({
          fromNetwork,
          toNetwork,
          fromAddress,
          toAddress,
          amount,
          express
        });
        
        res.json({
          success: true,
          data: {
            transactionId: transaction.id,
            status: transaction.status,
            fee: transaction.fee,
            estimatedTime: express ? '5-10 minutes' : '15-30 minutes'
          }
        });
        
        // Start processing
        this.processBridgeTransaction(transaction.id);
        
      } catch (error) {
        logger.error('Bridge initiation error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to initiate bridge transaction'
        });
      }
    });
    
    // Get transaction status
    this.app.get('/api/bridge/transaction/:id', async (req, res) => {
      try {
        const transaction = await BridgeTransaction.findOne({ id: req.params.id });
        
        if (!transaction) {
          return res.status(404).json({
            success: false,
            error: 'Transaction not found'
          });
        }
        
        res.json({
          success: true,
          data: transaction
        });
      } catch (error) {
        logger.error('Transaction status error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get transaction status'
        });
      }
    });
    
    // Get bridge statistics
    this.app.get('/api/bridge/stats', async (req, res) => {
      try {
        const { period = '24h', network } = req.query;
        const stats = await this.getBridgeStatistics(period, network);
        
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        logger.error('Statistics error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get statistics'
        });
      }
    });
    
    // Validator endpoints
    this.app.get('/api/validators', async (req, res) => {
      try {
        const validators = await Validator.find({ isActive: true });
        res.json({
          success: true,
          data: validators
        });
      } catch (error) {
        logger.error('Validators error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get validators'
        });
      }
    });
    
    // Admin endpoints (protected)
    this.app.post('/api/admin/pause', this.requireAuth, async (req, res) => {
      try {
        config.bridge.security.emergencyStop = true;
        logger.warn('Bridge paused by admin');
        
        res.json({
          success: true,
          message: 'Bridge paused successfully'
        });
      } catch (error) {
        logger.error('Pause error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to pause bridge'
        });
      }
    });
    
    this.app.post('/api/admin/resume', this.requireAuth, async (req, res) => {
      try {
        config.bridge.security.emergencyStop = false;
        logger.info('Bridge resumed by admin');
        
        res.json({
          success: true,
          message: 'Bridge resumed successfully'
        });
      } catch (error) {
        logger.error('Resume error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to resume bridge'
        });
      }
    });
  }
  
  initializeWebSocket() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected:', socket.id);
      
      socket.on('subscribe-transaction', (transactionId) => {
        socket.join(`transaction-${transactionId}`);
        logger.info(`Client ${socket.id} subscribed to transaction ${transactionId}`);
      });
      
      socket.on('subscribe-network', (network) => {
        socket.join(`network-${network}`);
        logger.info(`Client ${socket.id} subscribed to network ${network}`);
      });
      
      socket.on('disconnect', () => {
        logger.info('Client disconnected:', socket.id);
      });
    });
  }
  
  async initializeNetworks() {
    logger.info('Initializing network connections...');
    
    for (const [network, networkConfig] of Object.entries(config.networks)) {
      if (!networkConfig.enabled) continue;
      
      try {
        if (network === 'solana') {
          const connection = new Connection(networkConfig.rpcUrl, 'confirmed');
          this.connections.set(network, connection);
        } else {
          const web3 = new Web3(networkConfig.rpcUrl);
          this.connections.set(network, web3);
        }
        
        logger.info(`✅ Connected to ${network}`);
      } catch (error) {
        logger.error(`❌ Failed to connect to ${network}:`, error);
      }
    }
  }
  
  async validateBridgeRequest(request) {
    const { fromNetwork, toNetwork, fromAddress, toAddress, amount } = request;
    
    // Check if networks are enabled
    if (!isNetworkEnabled(fromNetwork) || !isNetworkEnabled(toNetwork)) {
      return { valid: false, error: 'Network not supported' };
    }
    
    // Check if bridge is paused
    if (config.bridge.security.emergencyStop) {
      return { valid: false, error: 'Bridge is currently paused' };
    }
    
    // Validate amount
    const amountBN = BigInt(amount);
    const minAmount = BigInt(config.bridge.limits.min);
    const maxAmount = BigInt(config.bridge.limits.max);
    
    if (amountBN < minAmount) {
      return { valid: false, error: `Amount below minimum: ${config.bridge.limits.min}` };
    }
    
    if (amountBN > maxAmount) {
      return { valid: false, error: `Amount above maximum: ${config.bridge.limits.max}` };
    }
    
    // Check daily limits
    const dailyVolume = await this.getDailyVolume(fromAddress);
    const dailyLimit = BigInt(config.bridge.limits.daily);
    
    if (dailyVolume + amountBN > dailyLimit) {
      return { valid: false, error: 'Daily limit exceeded' };
    }
    
    // Validate addresses
    if (!this.isValidAddress(fromAddress, fromNetwork)) {
      return { valid: false, error: 'Invalid from address' };
    }
    
    if (!this.isValidAddress(toAddress, toNetwork)) {
      return { valid: false, error: 'Invalid to address' };
    }
    
    return { valid: true };
  }
  
  async createBridgeTransaction(params) {
    const {
      fromNetwork,
      toNetwork,
      fromAddress,
      toAddress,
      amount,
      express
    } = params;
    
    const fee = getBridgeFee(fromNetwork, toNetwork, amount, express);
    const transactionId = this.generateTransactionId();
    
    const transaction = new BridgeTransaction({
      id: transactionId,
      fromNetwork,
      toNetwork,
      fromAddress,
      toAddress,
      amount,
      fee: fee.toString(),
      express,
      status: 'pending'
    });
    
    await transaction.save();
    
    logger.info('Bridge transaction created:', {
      id: transactionId,
      fromNetwork,
      toNetwork,
      amount,
      fee: fee.toString()
    });
    
    return transaction;
  }
  
  async processBridgeTransaction(transactionId) {
    try {
      const transaction = await BridgeTransaction.findOne({ id: transactionId });
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      logger.info(`Processing bridge transaction: ${transactionId}`);
      
      // Step 1: Lock tokens on source network
      const lockResult = await this.lockTokens(transaction);
      if (!lockResult.success) {
        throw new Error(lockResult.error);
      }
      
      transaction.fromTxHash = lockResult.txHash;
      transaction.status = 'confirmed';
      await transaction.save();
      
      // Emit update
      this.io.to(`transaction-${transactionId}`).emit('transaction-update', {
        id: transactionId,
        status: 'confirmed',
        fromTxHash: lockResult.txHash
      });
      
      // Step 2: Wait for confirmations
      await this.waitForConfirmations(transaction);
      
      // Step 3: Get validator signatures
      const validationResult = await this.getValidatorSignatures(transaction);
      if (!validationResult.success) {
        throw new Error(validationResult.error);
      }
      
      // Step 4: Mint tokens on destination network
      const mintResult = await this.mintTokens(transaction);
      if (!mintResult.success) {
        throw new Error(mintResult.error);
      }
      
      transaction.toTxHash = mintResult.txHash;
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      await transaction.save();
      
      // Emit completion
      this.io.to(`transaction-${transactionId}`).emit('transaction-update', {
        id: transactionId,
        status: 'completed',
        toTxHash: mintResult.txHash
      });
      
      logger.info(`Bridge transaction completed: ${transactionId}`);
      
    } catch (error) {
      logger.error(`Bridge transaction failed: ${transactionId}`, error);
      
      await BridgeTransaction.updateOne(
        { id: transactionId },
        {
          status: 'failed',
          errorMessage: error.message,
          $inc: { retryCount: 1 }
        }
      );
      
      this.io.to(`transaction-${transactionId}`).emit('transaction-update', {
        id: transactionId,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  async lockTokens(transaction) {
    // Implementation depends on the source network
    const { fromNetwork, fromAddress, amount } = transaction;
    
    try {
      if (fromNetwork === 'solana') {
        return await this.lockSolanaTokens(transaction);
      } else {
        return await this.lockEVMTokens(transaction);
      }
    } catch (error) {
      logger.error(`Failed to lock tokens on ${fromNetwork}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async mintTokens(transaction) {
    // Implementation depends on the destination network
    const { toNetwork, toAddress, amount } = transaction;
    
    try {
      if (toNetwork === 'solana') {
        return await this.mintSolanaTokens(transaction);
      } else {
        return await this.mintEVMTokens(transaction);
      }
    } catch (error) {
      logger.error(`Failed to mint tokens on ${toNetwork}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async lockSolanaTokens(transaction) {
    // Placeholder for Solana token locking
    logger.info('Locking Solana tokens:', transaction.id);
    
    // In a real implementation, this would:
    // 1. Create a lock transaction
    // 2. Transfer tokens to bridge program
    // 3. Return transaction hash
    
    return {
      success: true,
      txHash: 'solana_lock_' + Math.random().toString(36).substr(2, 9)
    };
  }
  
  async lockEVMTokens(transaction) {
    // Placeholder for EVM token locking
    logger.info('Locking EVM tokens:', transaction.id);
    
    // In a real implementation, this would:
    // 1. Call bridge contract lock function
    // 2. Wait for transaction confirmation
    // 3. Return transaction hash
    
    return {
      success: true,
      txHash: 'evm_lock_' + Math.random().toString(36).substr(2, 9)
    };
  }
  
  async mintSolanaTokens(transaction) {
    // Placeholder for Solana token minting
    logger.info('Minting Solana tokens:', transaction.id);
    
    return {
      success: true,
      txHash: 'solana_mint_' + Math.random().toString(36).substr(2, 9)
    };
  }
  
  async mintEVMTokens(transaction) {
    // Placeholder for EVM token minting
    logger.info('Minting EVM tokens:', transaction.id);
    
    return {
      success: true,
      txHash: 'evm_mint_' + Math.random().toString(36).substr(2, 9)
    };
  }
  
  async waitForConfirmations(transaction) {
    const networkConfig = getNetworkConfig(transaction.fromNetwork);
    const requiredConfirmations = networkConfig.confirmations;
    
    logger.info(`Waiting for ${requiredConfirmations} confirmations on ${transaction.fromNetwork}`);
    
    // Simulate confirmation waiting
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    transaction.confirmations = requiredConfirmations;
    await transaction.save();
  }
  
  async getValidatorSignatures(transaction) {
    const requiredValidators = config.bridge.validators.required;
    const activeValidators = await Validator.find({ isActive: true }).limit(requiredValidators);
    
    if (activeValidators.length < requiredValidators) {
      return {
        success: false,
        error: 'Insufficient active validators'
      };
    }
    
    // Simulate validator signatures
    const validations = activeValidators.map(validator => ({
      validator: validator.address,
      signature: 'sig_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }));
    
    transaction.validations = validations;
    await transaction.save();
    
    logger.info(`Got ${validations.length} validator signatures for transaction ${transaction.id}`);
    
    return { success: true, validations };
  }
  
  startBackgroundTasks() {
    // Monitor pending transactions
    cron.schedule('*/30 * * * * *', async () => {
      await this.monitorPendingTransactions();
    });
    
    // Update statistics
    cron.schedule('0 */5 * * * *', async () => {
      await this.updateStatistics();
    });
    
    // Health check
    cron.schedule('0 * * * * *', async () => {
      await this.performHealthCheck();
    });
    
    // Cleanup old transactions
    cron.schedule('0 0 * * *', async () => {
      await this.cleanupOldTransactions();
    });
  }
  
  async monitorPendingTransactions() {
    try {
      const pendingTransactions = await BridgeTransaction.find({
        status: { $in: ['pending', 'confirmed'] },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      for (const transaction of pendingTransactions) {
        // Check if transaction is stuck
        const timeDiff = Date.now() - transaction.updatedAt.getTime();
        if (timeDiff > config.bridge.validators.timeout) {
          logger.warn(`Transaction ${transaction.id} appears to be stuck`);
          
          // Retry if under retry limit
          if (transaction.retryCount < config.bridge.retry.maxAttempts) {
            logger.info(`Retrying transaction ${transaction.id}`);
            this.processBridgeTransaction(transaction.id);
          } else {
            logger.error(`Transaction ${transaction.id} exceeded retry limit`);
            await BridgeTransaction.updateOne(
              { id: transaction.id },
              { status: 'failed', errorMessage: 'Exceeded retry limit' }
            );
          }
        }
      }
    } catch (error) {
      logger.error('Error monitoring pending transactions:', error);
    }
  }
  
  async updateStatistics() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const network of Object.keys(config.networks)) {
        if (!isNetworkEnabled(network)) continue;
        
        const stats = await BridgeTransaction.aggregate([
          {
            $match: {
              $or: [{ fromNetwork: network }, { toNetwork: network }],
              createdAt: { $gte: today }
            }
          },
          {
            $group: {
              _id: null,
              totalVolume: { $sum: { $toDouble: '$amount' } },
              totalTransactions: { $sum: 1 },
              totalFees: { $sum: { $toDouble: '$fee' } },
              completedTransactions: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              }
            }
          }
        ]);
        
        if (stats.length > 0) {
          const stat = stats[0];
          const successRate = (stat.completedTransactions / stat.totalTransactions) * 100;
          
          await BridgeStats.updateOne(
            { date: today, network },
            {
              totalVolume: stat.totalVolume.toString(),
              totalTransactions: stat.totalTransactions,
              totalFees: stat.totalFees.toString(),
              successRate
            },
            { upsert: true }
          );
        }
      }
    } catch (error) {
      logger.error('Error updating statistics:', error);
    }
  }
  
  async performHealthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      networks: {},
      validators: this.validators.size,
      pendingTransactions: await BridgeTransaction.countDocuments({ status: 'pending' })
    };
    
    // Check network connections
    for (const [network, connection] of this.connections.entries()) {
      try {
        if (network === 'solana') {
          await connection.getLatestBlockhash();
        } else {
          await connection.eth.getBlockNumber();
        }
        health.networks[network] = 'healthy';
      } catch (error) {
        health.networks[network] = 'unhealthy';
        health.status = 'degraded';
        logger.warn(`Network ${network} health check failed:`, error.message);
      }
    }
    
    this.io.emit('health-update', health);
  }
  
  async cleanupOldTransactions() {
    try {
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const result = await BridgeTransaction.deleteMany({
        status: { $in: ['completed', 'failed'] },
        updatedAt: { $lt: cutoffDate }
      });
      
      logger.info(`Cleaned up ${result.deletedCount} old transactions`);
    } catch (error) {
      logger.error('Error cleaning up old transactions:', error);
    }
  }
  
  // Utility methods
  generateTransactionId() {
    return 'bridge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  isValidAddress(address, network) {
    try {
      if (network === 'solana') {
        new PublicKey(address);
        return true;
      } else {
        const web3 = this.connections.get(network);
        return web3.utils.isAddress(address);
      }
    } catch {
      return false;
    }
  }
  
  async getDailyVolume(address) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await BridgeTransaction.aggregate([
      {
        $match: {
          fromAddress: address,
          createdAt: { $gte: today },
          status: { $ne: 'failed' }
        }
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: { $toDouble: '$amount' } }
        }
      }
    ]);
    
    return result.length > 0 ? BigInt(Math.floor(result[0].totalVolume)) : BigInt(0);
  }
  
  getNetworkStatus() {
    const status = {};
    for (const [network, connection] of this.connections.entries()) {
      status[network] = {
        connected: !!connection,
        enabled: isNetworkEnabled(network)
      };
    }
    return status;
  }
  
  async getBridgeStatistics(period, network) {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    const matchQuery = {
      createdAt: { $gte: startDate }
    };
    
    if (network) {
      matchQuery.$or = [
        { fromNetwork: network },
        { toNetwork: network }
      ];
    }
    
    const stats = await BridgeTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: { $toDouble: '$amount' } },
          totalTransactions: { $sum: 1 },
          totalFees: { $sum: { $toDouble: '$fee' } },
          completedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageAmount: { $avg: { $toDouble: '$amount' } }
        }
      }
    ]);
    
    if (stats.length === 0) {
      return {
        totalVolume: '0',
        totalTransactions: 0,
        totalFees: '0',
        successRate: 100,
        averageAmount: '0'
      };
    }
    
    const stat = stats[0];
    return {
      totalVolume: stat.totalVolume.toString(),
      totalTransactions: stat.totalTransactions,
      totalFees: stat.totalFees.toString(),
      successRate: (stat.completedTransactions / stat.totalTransactions) * 100,
      averageAmount: stat.averageAmount.toString()
    };
  }
  
  requireAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || !config.bridge.api.auth.apiKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    next();
  }
  
  async start() {
    try {
      // Connect to database
      await mongoose.connect(config.bridge.database.url, config.bridge.database.options);
      logger.info('✅ Connected to database');
      
      // Validate configuration
      validateConfig();
      
      // Start server
      this.server.listen(config.bridge.api.port, () => {
        logger.info(`🌉 LUNACOIN Bridge started on port ${config.bridge.api.port}`);
        logger.info('🔗 Supported networks:', Object.keys(config.networks).filter(isNetworkEnabled));
      });
      
    } catch (error) {
      logger.error('Failed to start bridge:', error);
      process.exit(1);
    }
  }
}

// Start the bridge if this file is run directly
if (require.main === module) {
  const bridge = new LunacoinBridge();
  bridge.start();
}

module.exports = LunacoinBridge;