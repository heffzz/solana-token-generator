const config = {
  // Network configurations
  networks: {
    solana: {
      name: 'Solana',
      chainId: 'solana-mainnet',
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      wsUrl: process.env.SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com',
      programId: process.env.SOLANA_BRIDGE_PROGRAM_ID,
      tokenMint: process.env.LUNACOIN_MINT_ADDRESS,
      bridgeAuthority: process.env.SOLANA_BRIDGE_AUTHORITY,
      confirmations: 32,
      gasLimit: 200000,
      enabled: true,
      testnet: {
        rpcUrl: 'https://api.devnet.solana.com',
        wsUrl: 'wss://api.devnet.solana.com',
        chainId: 'solana-devnet'
      }
    },
    ethereum: {
      name: 'Ethereum',
      chainId: 1,
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/' + process.env.INFURA_PROJECT_ID,
      wsUrl: process.env.ETHEREUM_WS_URL || 'wss://mainnet.infura.io/ws/v3/' + process.env.INFURA_PROJECT_ID,
      bridgeContract: process.env.ETHEREUM_BRIDGE_CONTRACT,
      tokenContract: process.env.ETHEREUM_LUNACOIN_CONTRACT,
      confirmations: 12,
      gasLimit: 300000,
      gasPrice: 'auto',
      maxFeePerGas: '100000000000', // 100 gwei
      maxPriorityFeePerGas: '2000000000', // 2 gwei
      enabled: true,
      testnet: {
        chainId: 5, // Goerli
        rpcUrl: 'https://goerli.infura.io/v3/' + process.env.INFURA_PROJECT_ID,
        wsUrl: 'wss://goerli.infura.io/ws/v3/' + process.env.INFURA_PROJECT_ID
      }
    },
    bsc: {
      name: 'Binance Smart Chain',
      chainId: 56,
      rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
      wsUrl: process.env.BSC_WS_URL || 'wss://bsc-ws-node.nariox.org:443',
      bridgeContract: process.env.BSC_BRIDGE_CONTRACT,
      tokenContract: process.env.BSC_LUNACOIN_CONTRACT,
      confirmations: 15,
      gasLimit: 200000,
      gasPrice: '5000000000', // 5 gwei
      enabled: true,
      testnet: {
        chainId: 97, // BSC Testnet
        rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
        wsUrl: 'wss://bsc-testnet.nodereal.io/ws/v1/' + process.env.NODEREAL_API_KEY
      }
    },
    polygon: {
      name: 'Polygon',
      chainId: 137,
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      wsUrl: process.env.POLYGON_WS_URL || 'wss://polygon-rpc.com',
      bridgeContract: process.env.POLYGON_BRIDGE_CONTRACT,
      tokenContract: process.env.POLYGON_LUNACOIN_CONTRACT,
      confirmations: 20,
      gasLimit: 250000,
      gasPrice: '30000000000', // 30 gwei
      enabled: true,
      testnet: {
        chainId: 80001, // Mumbai
        rpcUrl: 'https://rpc-mumbai.maticvigil.com',
        wsUrl: 'wss://rpc-mumbai.maticvigil.com/ws'
      }
    },
    avalanche: {
      name: 'Avalanche',
      chainId: 43114,
      rpcUrl: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
      wsUrl: process.env.AVALANCHE_WS_URL || 'wss://api.avax.network/ext/bc/C/ws',
      bridgeContract: process.env.AVALANCHE_BRIDGE_CONTRACT,
      tokenContract: process.env.AVALANCHE_LUNACOIN_CONTRACT,
      confirmations: 10,
      gasLimit: 200000,
      gasPrice: '25000000000', // 25 gwei
      enabled: false, // Disabled by default
      testnet: {
        chainId: 43113, // Fuji
        rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
        wsUrl: 'wss://api.avax-test.network/ext/bc/C/ws'
      }
    }
  },

  // Bridge settings
  bridge: {
    // Minimum and maximum bridge amounts
    limits: {
      min: '1000000', // 1 LUNA (6 decimals)
      max: '1000000000000', // 1M LUNA
      daily: '10000000000000' // 10M LUNA daily limit
    },

    // Bridge fees (in basis points, 1 bp = 0.01%)
    fees: {
      base: 50, // 0.5% base fee
      network: {
        ethereum: 100, // 1% for Ethereum (high gas)
        bsc: 25, // 0.25% for BSC
        polygon: 25, // 0.25% for Polygon
        avalanche: 50, // 0.5% for Avalanche
        solana: 10 // 0.1% for Solana
      },
      express: 200, // 2% for express transfers (faster)
      minimum: '100000' // Minimum fee: 0.1 LUNA
    },

    // Validator settings
    validators: {
      required: 3, // Minimum validators required
      threshold: 67, // 67% consensus required
      timeout: 3600000, // 1 hour timeout for validation
      slashingEnabled: true,
      slashingAmount: '10000000000' // 10K LUNA slash amount
    },

    // Security settings
    security: {
      pausable: true,
      emergencyStop: false,
      rateLimiting: {
        enabled: true,
        windowMs: 3600000, // 1 hour
        maxTransactions: 100,
        maxVolume: '100000000000000' // 100M LUNA per hour
      },
      blacklist: {
        enabled: true,
        addresses: [],
        countries: ['US', 'CN'] // Restricted countries
      },
      kyc: {
        required: false,
        threshold: '100000000000' // 100K LUNA requires KYC
      }
    },

    // Monitoring and alerts
    monitoring: {
      enabled: true,
      healthCheck: {
        interval: 30000, // 30 seconds
        timeout: 10000, // 10 seconds
        retries: 3
      },
      alerts: {
        email: process.env.ALERT_EMAIL,
        telegram: process.env.ALERT_TELEGRAM_CHAT_ID,
        discord: process.env.ALERT_DISCORD_WEBHOOK,
        thresholds: {
          failedTransactions: 5,
          highVolume: '1000000000000', // 1M LUNA
          lowLiquidity: '10000000000', // 10K LUNA
          validatorOffline: 1
        }
      }
    },

    // Retry and timeout settings
    retry: {
      maxAttempts: 5,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000
    },

    // Database settings
    database: {
      url: process.env.DATABASE_URL || 'mongodb://localhost:27017/lunacoin_bridge',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      }
    },

    // API settings
    api: {
      port: process.env.BRIDGE_API_PORT || 3003,
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true
      },
      rateLimit: {
        windowMs: 900000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP'
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
        jwtExpiration: '24h',
        apiKeys: process.env.API_KEYS?.split(',') || []
      }
    },

    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: {
        enabled: true,
        path: './logs/bridge.log',
        maxSize: '10m',
        maxFiles: 5
      },
      console: {
        enabled: true,
        colorize: true
      }
    }
  },

  // Development settings
  development: {
    enabled: process.env.NODE_ENV === 'development',
    mockMode: process.env.MOCK_MODE === 'true',
    testnetOnly: process.env.TESTNET_ONLY === 'true',
    debugTransactions: process.env.DEBUG_TRANSACTIONS === 'true',
    skipValidation: process.env.SKIP_VALIDATION === 'true'
  },

  // External services
  services: {
    priceOracle: {
      enabled: true,
      providers: [
        {
          name: 'chainlink',
          url: 'https://api.chain.link',
          apiKey: process.env.CHAINLINK_API_KEY
        },
        {
          name: 'coingecko',
          url: 'https://api.coingecko.com/api/v3',
          apiKey: process.env.COINGECKO_API_KEY
        }
      ],
      updateInterval: 300000, // 5 minutes
      deviation: 5 // 5% price deviation threshold
    },
    
    analytics: {
      enabled: true,
      provider: 'mixpanel',
      apiKey: process.env.MIXPANEL_API_KEY,
      events: {
        bridgeInitiated: true,
        bridgeCompleted: true,
        bridgeFailed: true,
        validatorAction: true
      }
    },

    notification: {
      email: {
        provider: 'sendgrid',
        apiKey: process.env.SENDGRID_API_KEY,
        from: process.env.EMAIL_FROM || 'noreply@lunacoin.io'
      },
      sms: {
        provider: 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        from: process.env.TWILIO_FROM
      }
    }
  },

  // Feature flags
  features: {
    expressTransfers: true,
    batchTransfers: true,
    scheduledTransfers: false,
    liquidityMining: true,
    governance: true,
    nftBridge: false,
    defiIntegration: true
  }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  // Production overrides
  config.bridge.security.emergencyStop = false;
  config.development.enabled = false;
  config.bridge.logging.level = 'warn';
} else if (process.env.NODE_ENV === 'test') {
  // Test overrides
  config.development.mockMode = true;
  config.bridge.validators.required = 1;
  config.bridge.validators.threshold = 51;
  // Rate limiting rimane abilitato anche in test per sicurezza
  config.bridge.security.rateLimiting.maxTransactions = 1000; // Aumentato per test
}

// Validate configuration
function validateConfig() {
  const errors = [];
  
  // Check required environment variables
  const requiredEnvVars = [
    'SOLANA_BRIDGE_PROGRAM_ID',
    'LUNACOIN_MINT_ADDRESS',
    'DATABASE_URL'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  });
  
  // Validate network configurations
  Object.entries(config.networks).forEach(([network, networkConfig]) => {
    if (networkConfig.enabled) {
      if (!networkConfig.rpcUrl) {
        errors.push(`Missing RPC URL for network: ${network}`);
      }
      if (!networkConfig.bridgeContract && network !== 'solana') {
        errors.push(`Missing bridge contract for network: ${network}`);
      }
    }
  });
  
  // Validate bridge limits
  if (parseInt(config.bridge.limits.min) >= parseInt(config.bridge.limits.max)) {
    errors.push('Bridge minimum limit must be less than maximum limit');
  }
  
  // Validate validator settings
  if (config.bridge.validators.threshold < 51 || config.bridge.validators.threshold > 100) {
    errors.push('Validator threshold must be between 51% and 100%');
  }
  
  if (errors.length > 0) {
    throw new Error('Configuration validation failed:\n' + errors.join('\n'));
  }
  
  return true;
}

// Helper functions
function getNetworkConfig(network, testnet = false) {
  const networkConfig = config.networks[network];
  if (!networkConfig) {
    throw new Error(`Unknown network: ${network}`);
  }
  
  if (testnet && networkConfig.testnet) {
    return { ...networkConfig, ...networkConfig.testnet };
  }
  
  return networkConfig;
}

function getBridgeFee(fromNetwork, toNetwork, amount, express = false) {
  const baseFee = config.bridge.fees.base;
  const networkFee = config.bridge.fees.network[toNetwork] || 0;
  const expressFee = express ? config.bridge.fees.express : 0;
  
  const totalFeeRate = baseFee + networkFee + expressFee;
  const calculatedFee = Math.floor((amount * totalFeeRate) / 10000);
  
  return Math.max(calculatedFee, parseInt(config.bridge.fees.minimum));
}

function isNetworkEnabled(network) {
  return config.networks[network]?.enabled || false;
}

function getEnabledNetworks() {
  return Object.entries(config.networks)
    .filter(([_, networkConfig]) => networkConfig.enabled)
    .map(([network, _]) => network);
}

// Export configuration and utilities
module.exports = {
  config,
  validateConfig,
  getNetworkConfig,
  getBridgeFee,
  isNetworkEnabled,
  getEnabledNetworks
};

// Validate configuration on load
if (process.env.NODE_ENV !== 'test') {
  try {
    validateConfig();
    console.log('✅ Bridge configuration validated successfully');
  } catch (error) {
    console.error('❌ Bridge configuration validation failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}