// Configurazione principale per LUNACOIN

module.exports = {
  // Informazioni del token
  token: {
    name: 'LUNACOIN',
    symbol: 'LUNA',
    decimals: 9,
    totalSupply: 1000000000, // 1 miliardo di token
    description: 'LUNACOIN è un token SPL innovativo su Solana che combina le migliori pratiche delle memecoin di successo con una solida base tecnica e una strategia di distribuzione equa.',
    image: 'https://example.com/lunacoin-logo.png', // Da aggiornare con l'URL reale
    website: 'https://lunacoin.io', // Da aggiornare con l'URL reale
    twitter: 'https://twitter.com/lunacoin_sol',
    telegram: 'https://t.me/lunacoin_official'
  },

  // Distribuzione dei token
  distribution: {
    community: 0.50, // 50% alla community
    liquidity: 0.20, // 20% per liquidità
    development: 0.15, // 15% per sviluppo e marketing
    partnerships: 0.10, // 10% per partnership
    team: 0.05 // 5% per il team (con vesting)
  },

  // Configurazione Solana
  solana: {
    network: process.env.SOLANA_NETWORK || 'devnet', // mainnet-beta per produzione
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    commitment: 'confirmed'
  },

  // Configurazione DEX per il listing
  dex: {
    raydium: {
      enabled: true,
      initialLiquidity: 100, // SOL
      slippage: 0.5 // 0.5%
    },
    orca: {
      enabled: true,
      initialLiquidity: 50, // SOL
      slippage: 0.5
    },
    jupiter: {
      enabled: true
    }
  },

  // Configurazione sicurezza
  security: {
    lockLiquidity: true,
    lockDuration: 365, // giorni
    renounceAuthorities: {
      mint: true,
      freeze: true,
      update: true
    },
    multisig: {
      enabled: true,
      threshold: 2,
      signers: 3
    }
  },

  // Configurazione monitoraggio
  monitoring: {
    enabled: true,
    interval: 60000, // 1 minuto
    alerts: {
      priceChange: 0.10, // 10%
      volumeThreshold: 1000, // USD
      liquidityThreshold: 10000 // USD
    }
  },

  // API endpoints per validazione
  apis: {
    solscan: 'https://api.solscan.io',
    dexscreener: 'https://api.dexscreener.com/latest/dex',
    coingecko: 'https://api.coingecko.com/api/v3',
    jupiter: 'https://quote-api.jup.ag/v6'
  },

  // Configurazione logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: './logs/lunacoin.log',
    maxSize: '10m',
    maxFiles: 5
  }
};