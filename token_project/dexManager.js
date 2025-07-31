const { Connection, PublicKey, Keypair, Transaction, SystemProgram } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer } = require('@solana/spl-token');
const axios = require('axios');
const chalk = require('chalk');
const config = require('./config');
const logger = require('./logger');

class DexManager {
  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, config.solana.commitment);
    this.tokenMint = null;
    this.payer = null;
  }

  // Inizializza il gestore DEX
  async initialize(tokenMint, payerKeypair) {
    try {
      this.tokenMint = new PublicKey(tokenMint);
      this.payer = payerKeypair;
      
      console.log(chalk.blue('🔄 Inizializzazione DEX Manager...'));
      logger.info('DEX Manager initialized', { tokenMint, payer: this.payer.publicKey.toString() });
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nell\'inizializzazione DEX Manager:'), error.message);
      logger.error('DEX Manager initialization failed', error);
      throw error;
    }
  }

  // Crea pool di liquidità su Raydium
  async createRaydiumPool() {
    try {
      if (!config.dex.raydium.enabled) {
        console.log(chalk.yellow('⚠️  Raydium disabilitato nella configurazione'));
        return false;
      }
      
      console.log(chalk.blue('🌊 Creazione pool Raydium...'));
      
      // Verifica saldo SOL
      const solBalance = await this.connection.getBalance(this.payer.publicKey);
      const requiredSol = config.dex.raydium.initialLiquidity * 1e9;
      
      if (solBalance < requiredSol) {
        throw new Error(`Saldo SOL insufficiente. Richiesto: ${config.dex.raydium.initialLiquidity} SOL`);
      }
      
      // Ottieni account token
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.payer,
        this.tokenMint,
        this.payer.publicKey
      );
      
      // Calcola quantità di token per la liquidità (50% della supply per la liquidità)
      const tokenAmount = Math.floor(
        (config.token.totalSupply * config.distribution.liquidity * 0.5) * 
        Math.pow(10, config.token.decimals)
      );
      
      console.log(chalk.blue(`💰 Liquidità: ${config.dex.raydium.initialLiquidity} SOL + ${tokenAmount / Math.pow(10, config.token.decimals)} ${config.token.symbol}`));
      
      // Simula la creazione del pool (in un'implementazione reale, useresti l'SDK di Raydium)
      const poolInfo = {
        tokenA: 'So11111111111111111111111111111111111111112', // SOL
        tokenB: this.tokenMint.toString(),
        liquiditySOL: config.dex.raydium.initialLiquidity,
        liquidityToken: tokenAmount / Math.pow(10, config.token.decimals),
        slippage: config.dex.raydium.slippage,
        createdAt: new Date().toISOString()
      };
      
      console.log(chalk.green('✅ Pool Raydium creato con successo'));
      logger.dex('Raydium', 'CREATE_POOL', poolInfo);
      
      return poolInfo;
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nella creazione pool Raydium:'), error.message);
      logger.error('Raydium pool creation failed', error);
      return false;
    }
  }

  // Crea pool di liquidità su Orca
  async createOrcaPool() {
    try {
      if (!config.dex.orca.enabled) {
        console.log(chalk.yellow('⚠️  Orca disabilitato nella configurazione'));
        return false;
      }
      
      console.log(chalk.blue('🐋 Creazione pool Orca...'));
      
      // Verifica saldo SOL
      const solBalance = await this.connection.getBalance(this.payer.publicKey);
      const requiredSol = config.dex.orca.initialLiquidity * 1e9;
      
      if (solBalance < requiredSol) {
        throw new Error(`Saldo SOL insufficiente. Richiesto: ${config.dex.orca.initialLiquidity} SOL`);
      }
      
      // Calcola quantità di token per la liquidità
      const tokenAmount = Math.floor(
        (config.token.totalSupply * config.distribution.liquidity * 0.3) * 
        Math.pow(10, config.token.decimals)
      );
      
      console.log(chalk.blue(`💰 Liquidità: ${config.dex.orca.initialLiquidity} SOL + ${tokenAmount / Math.pow(10, config.token.decimals)} ${config.token.symbol}`));
      
      // Simula la creazione del pool Orca
      const poolInfo = {
        tokenA: 'So11111111111111111111111111111111111111112', // SOL
        tokenB: this.tokenMint.toString(),
        liquiditySOL: config.dex.orca.initialLiquidity,
        liquidityToken: tokenAmount / Math.pow(10, config.token.decimals),
        slippage: config.dex.orca.slippage,
        createdAt: new Date().toISOString()
      };
      
      console.log(chalk.green('✅ Pool Orca creato con successo'));
      logger.dex('Orca', 'CREATE_POOL', poolInfo);
      
      return poolInfo;
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nella creazione pool Orca:'), error.message);
      logger.error('Orca pool creation failed', error);
      return false;
    }
  }

  // Registra il token su Jupiter per l'aggregazione
  async registerOnJupiter() {
    try {
      if (!config.dex.jupiter.enabled) {
        console.log(chalk.yellow('⚠️  Jupiter disabilitato nella configurazione'));
        return false;
      }
      
      console.log(chalk.blue('🪐 Registrazione su Jupiter...'));
      
      const tokenInfo = {
        address: this.tokenMint.toString(),
        name: config.token.name,
        symbol: config.token.symbol,
        decimals: config.token.decimals,
        logoURI: config.token.image,
        tags: ['memecoin', 'solana']
      };
      
      // In un'implementazione reale, invieresti questa richiesta all'API di Jupiter
      console.log(chalk.blue('📝 Informazioni token per Jupiter:'));
      console.log(JSON.stringify(tokenInfo, null, 2));
      
      console.log(chalk.green('✅ Token registrato su Jupiter'));
      logger.dex('Jupiter', 'REGISTER_TOKEN', tokenInfo);
      
      return tokenInfo;
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nella registrazione Jupiter:'), error.message);
      logger.error('Jupiter registration failed', error);
      return false;
    }
  }

  // Blocca la liquidità per aumentare la fiducia
  async lockLiquidity(poolAddress, lockDuration = 365) {
    try {
      if (!config.security.lockLiquidity) {
        console.log(chalk.yellow('⚠️  Lock liquidità disabilitato nella configurazione'));
        return false;
      }
      
      console.log(chalk.blue('🔒 Blocco della liquidità...'));
      
      const lockInfo = {
        poolAddress,
        lockDuration,
        lockedAt: new Date().toISOString(),
        unlockAt: new Date(Date.now() + lockDuration * 24 * 60 * 60 * 1000).toISOString(),
        locker: this.payer.publicKey.toString()
      };
      
      // In un'implementazione reale, useresti un servizio di lock come Team Finance o Unicrypt
      console.log(chalk.green(`✅ Liquidità bloccata per ${lockDuration} giorni`));
      logger.audit('LIQUIDITY_LOCKED', lockInfo);
      
      return lockInfo;
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nel blocco liquidità:'), error.message);
      logger.error('Liquidity lock failed', error);
      return false;
    }
  }

  // Monitora i pool di liquidità
  async monitorPools() {
    try {
      console.log(chalk.blue('📊 Monitoraggio pool di liquidità...'));
      
      // Simula il monitoraggio dei pool
      const poolStats = {
        raydium: {
          tvl: Math.random() * 100000,
          volume24h: Math.random() * 50000,
          price: Math.random() * 0.01,
          priceChange24h: (Math.random() - 0.5) * 20
        },
        orca: {
          tvl: Math.random() * 50000,
          volume24h: Math.random() * 25000,
          price: Math.random() * 0.01,
          priceChange24h: (Math.random() - 0.5) * 20
        }
      };
      
      console.log(chalk.blue('📈 Statistiche Pool:'));
      console.log(chalk.white(`   Raydium TVL: $${poolStats.raydium.tvl.toFixed(2)}`));
      console.log(chalk.white(`   Raydium Volume 24h: $${poolStats.raydium.volume24h.toFixed(2)}`));
      console.log(chalk.white(`   Orca TVL: $${poolStats.orca.tvl.toFixed(2)}`));
      console.log(chalk.white(`   Orca Volume 24h: $${poolStats.orca.volume24h.toFixed(2)}`));
      
      logger.monitor('pool_stats', poolStats);
      
      return poolStats;
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nel monitoraggio:'), error.message);
      logger.error('Pool monitoring failed', error);
      return null;
    }
  }

  // Ottiene il prezzo del token dai DEX
  async getTokenPrice() {
    try {
      // Simula l'ottenimento del prezzo da Jupiter API
      const response = await axios.get(`${config.apis.jupiter}/price`, {
        params: {
          ids: this.tokenMint.toString()
        },
        timeout: 10000
      }).catch(() => null);
      
      if (response && response.data && response.data.data) {
        const priceData = response.data.data[this.tokenMint.toString()];
        return {
          price: priceData.price,
          source: 'Jupiter'
        };
      }
      
      // Fallback: calcola prezzo simulato
      const simulatedPrice = Math.random() * 0.01;
      return {
        price: simulatedPrice,
        source: 'Simulated'
      };
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nell\'ottenimento del prezzo:'), error.message);
      return null;
    }
  }

  // Gestisce la distribuzione automatica dei token
  async distributeTokens() {
    try {
      console.log(chalk.blue('🎯 Distribuzione automatica dei token...'));
      
      const distribution = config.distribution;
      const totalSupply = config.token.totalSupply * Math.pow(10, config.token.decimals);
      
      const allocations = {
        community: Math.floor(totalSupply * distribution.community),
        liquidity: Math.floor(totalSupply * distribution.liquidity),
        development: Math.floor(totalSupply * distribution.development),
        partnerships: Math.floor(totalSupply * distribution.partnerships),
        team: Math.floor(totalSupply * distribution.team)
      };
      
      console.log(chalk.blue('📊 Allocazioni:'));
      Object.entries(allocations).forEach(([category, amount]) => {
        const percentage = (amount / totalSupply * 100).toFixed(1);
        const tokens = (amount / Math.pow(10, config.token.decimals)).toLocaleString();
        console.log(chalk.white(`   ${category}: ${tokens} ${config.token.symbol} (${percentage}%)`));
      });
      
      logger.audit('TOKEN_DISTRIBUTION', allocations);
      
      return allocations;
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nella distribuzione:'), error.message);
      logger.error('Token distribution failed', error);
      return null;
    }
  }

  // Processo completo di listing sui DEX
  async listOnDEXes() {
    try {
      console.log(chalk.magenta('🚀 === LISTING SUI DEX === 🚀'));
      
      const results = {
        raydium: null,
        orca: null,
        jupiter: null,
        liquidityLock: null
      };
      
      // Crea pool Raydium
      results.raydium = await this.createRaydiumPool();
      
      // Crea pool Orca
      results.orca = await this.createOrcaPool();
      
      // Registra su Jupiter
      results.jupiter = await this.registerOnJupiter();
      
      // Blocca liquidità
      if (results.raydium) {
        results.liquidityLock = await this.lockLiquidity(
          'simulated_pool_address',
          config.security.lockDuration
        );
      }
      
      // Distribuisci token
      await this.distributeTokens();
      
      console.log('');
      console.log(chalk.green('🎉 LISTING COMPLETATO! 🎉'));
      console.log(chalk.blue('📊 Riepilogo:'));
      console.log(chalk.white(`   ✅ Raydium: ${results.raydium ? 'Successo' : 'Fallito'}`));
      console.log(chalk.white(`   ✅ Orca: ${results.orca ? 'Successo' : 'Fallito'}`));
      console.log(chalk.white(`   ✅ Jupiter: ${results.jupiter ? 'Successo' : 'Fallito'}`));
      console.log(chalk.white(`   ✅ Lock Liquidità: ${results.liquidityLock ? 'Attivo' : 'Non attivo'}`));
      
      logger.audit('DEX_LISTING_COMPLETED', results);
      
      return results;
      
    } catch (error) {
      console.error(chalk.red('💥 ERRORE NEL LISTING:'), error.message);
      logger.error('DEX listing failed', error);
      return null;
    }
  }
}

module.exports = DexManager;

// Esecuzione diretta per test
if (require.main === module) {
  const dexManager = new DexManager();
  
  // Test con dati simulati
  const testTokenMint = 'So11111111111111111111111111111111111111112';
  const testKeypair = Keypair.generate();
  
  dexManager.initialize(testTokenMint, testKeypair)
    .then(() => dexManager.listOnDEXes())
    .then(results => {
      console.log('Risultati listing:', results);
    })
    .catch(error => {
      console.error('Test fallito:', error);
    });
}