#!/usr/bin/env node

const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const config = require('./config');
const logger = require('./logger');
const TokenGenerator = require('./tokenGenerator');
const TokenValidator = require('./tokenValidator');
const DexManager = require('./dexManager');
const TokenMonitor = require('./monitor');

class LunacoinSystem {
  constructor() {
    this.tokenGenerator = new TokenGenerator();
    this.dexManager = new DexManager();
    this.monitor = new TokenMonitor();
    this.tokenInfo = null;
  }

  // Mostra banner di benvenuto
  showBanner() {
    console.clear();
    console.log(chalk.magenta('🌙'.repeat(50)));
    console.log(chalk.magenta('🌙') + chalk.white('                                                ') + chalk.magenta('🌙'));
    console.log(chalk.magenta('🌙') + chalk.cyan('           LUNACOIN AUTONOMOUS SYSTEM           ') + chalk.magenta('🌙'));
    console.log(chalk.magenta('🌙') + chalk.white('                                                ') + chalk.magenta('🌙'));
    console.log(chalk.magenta('🌙') + chalk.yellow('    Sistema Autonomo per Token SPL su Solana     ') + chalk.magenta('🌙'));
    console.log(chalk.magenta('🌙') + chalk.white('                                                ') + chalk.magenta('🌙'));
    console.log(chalk.magenta('🌙'.repeat(50)));
    console.log('');
    console.log(chalk.blue('🚀 Funzionalità:'));
    console.log(chalk.white('   ✅ Generazione automatica token SPL'));
    console.log(chalk.white('   ✅ Validazione unicità nome e simbolo'));
    console.log(chalk.white('   ✅ Listing automatico sui DEX'));
    console.log(chalk.white('   ✅ Gestione liquidità e sicurezza'));
    console.log(chalk.white('   ✅ Monitoraggio continuo e alert'));
    console.log(chalk.white('   ✅ Correzioni automatiche'));
    console.log('');
  }

  // Menu principale
  async showMainMenu() {
    const choices = [
      {
        name: '🚀 Genera Nuovo Token',
        value: 'generate'
      },
      {
        name: '📊 Monitora Token Esistente',
        value: 'monitor'
      },
      {
        name: '🔍 Valida Token',
        value: 'validate'
      },
      {
        name: '🌊 Gestisci DEX e Liquidità',
        value: 'dex'
      },
      {
        name: '📈 Visualizza Statistiche',
        value: 'stats'
      },
      {
        name: '⚙️  Configurazione',
        value: 'config'
      },
      {
        name: '📋 Report e Log',
        value: 'reports'
      },
      {
        name: '❌ Esci',
        value: 'exit'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Seleziona un\'azione:',
        choices
      }
    ]);

    return action;
  }

  // Processo completo di generazione token
  async generateToken() {
    try {
      console.log(chalk.blue('🚀 === GENERAZIONE AUTOMATICA TOKEN === 🚀'));
      console.log('');
      
      // Mostra configurazione corrente
      console.log(chalk.blue('📋 Configurazione Token:'));
      console.log(chalk.white(`   Nome: ${config.token.name}`));
      console.log(chalk.white(`   Simbolo: ${config.token.symbol}`));
      console.log(chalk.white(`   Supply: ${config.token.totalSupply.toLocaleString()}`));
      console.log(chalk.white(`   Decimali: ${config.token.decimals}`));
      console.log(chalk.white(`   Network: ${config.solana.network}`));
      console.log('');
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Procedere con la generazione?',
          default: true
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.yellow('❌ Operazione annullata'));
        return;
      }
      
      // Fase 1: Validazione
      console.log(chalk.blue('\n📋 FASE 1: Validazione Token'));
      const isValid = await TokenValidator.validateToken(config.token);
      
      if (!isValid) {
        console.log(chalk.red('❌ Validazione fallita. Controlla la configurazione.'));
        return;
      }
      
      // Fase 2: Generazione Token
      console.log(chalk.blue('\n🏗️  FASE 2: Generazione Token SPL'));
      const tokenResult = await this.tokenGenerator.generateToken();
      
      if (!tokenResult.success) {
        console.log(chalk.red('❌ Generazione token fallita'));
        return;
      }
      
      this.tokenInfo = tokenResult;
      
      // Fase 3: Listing sui DEX
      console.log(chalk.blue('\n🌊 FASE 3: Listing sui DEX'));
      await this.dexManager.initialize(tokenResult.tokenAddress, this.tokenGenerator.payer);
      const dexResult = await this.dexManager.listOnDEXes();
      
      // Fase 4: Avvio Monitoraggio
      console.log(chalk.blue('\n📊 FASE 4: Avvio Monitoraggio'));
      await this.monitor.initialize(tokenResult.tokenAddress);
      this.monitor.startMonitoring();
      
      // Riepilogo finale
      console.log('');
      console.log(chalk.green('🎉'.repeat(50)));
      console.log(chalk.green('🎉') + chalk.white('                                                ') + chalk.green('🎉'));
      console.log(chalk.green('🎉') + chalk.cyan('            TOKEN CREATO CON SUCCESSO!          ') + chalk.green('🎉'));
      console.log(chalk.green('🎉') + chalk.white('                                                ') + chalk.green('🎉'));
      console.log(chalk.green('🎉'.repeat(50)));
      console.log('');
      console.log(chalk.blue('📍 Informazioni Token:'));
      console.log(chalk.white(`   🏷️  Nome: ${config.token.name}`));
      console.log(chalk.white(`   🔖 Simbolo: ${config.token.symbol}`));
      console.log(chalk.white(`   📍 Indirizzo: ${tokenResult.tokenAddress}`));
      console.log(chalk.white(`   👤 Creatore: ${tokenResult.creatorAddress}`));
      console.log(chalk.white(`   🌐 Network: ${config.solana.network}`));
      console.log('');
      console.log(chalk.blue('🔗 Link Utili:'));
      console.log(chalk.white(`   🔍 Solscan: https://solscan.io/token/${tokenResult.tokenAddress}`));
      console.log(chalk.white(`   📊 DexScreener: https://dexscreener.com/solana/${tokenResult.tokenAddress}`));
      console.log('');
      console.log(chalk.yellow('📝 Prossimi Passi:'));
      console.log(chalk.white('   1. Il monitoraggio è già attivo'));
      console.log(chalk.white('   2. Controlla i report nella cartella ./reports'));
      console.log(chalk.white('   3. Monitora gli alert nella cartella ./data'));
      console.log(chalk.white('   4. Avvia campagne marketing'));
      console.log('');
      
      logger.audit('TOKEN_GENERATION_COMPLETED', {
        tokenAddress: tokenResult.tokenAddress,
        creatorAddress: tokenResult.creatorAddress,
        dexListing: dexResult,
        monitoringActive: true
      });
      
    } catch (error) {
      console.error(chalk.red('💥 ERRORE CRITICO:'), error.message);
      logger.error('Token generation process failed', error);
    }
  }

  // Monitora token esistente
  async monitorExistingToken() {
    try {
      const { tokenAddress } = await inquirer.prompt([
        {
          type: 'input',
          name: 'tokenAddress',
          message: 'Inserisci l\'indirizzo del token da monitorare:',
          validate: (input) => {
            if (!input || input.length < 32) {
              return 'Inserisci un indirizzo valido';
            }
            return true;
          }
        }
      ]);
      
      console.log(chalk.blue('📊 Inizializzazione monitoraggio...'));
      
      await this.monitor.initialize(tokenAddress);
      await this.monitor.updateMetrics();
      
      const { startContinuous } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'startContinuous',
          message: 'Avviare monitoraggio continuo?',
          default: true
        }
      ]);
      
      if (startContinuous) {
        this.monitor.startMonitoring();
        console.log(chalk.green('✅ Monitoraggio continuo attivato'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nel monitoraggio:'), error.message);
      logger.error('Token monitoring failed', error);
    }
  }

  // Gestione DEX
  async manageDEX() {
    try {
      if (!this.tokenInfo) {
        const { tokenAddress } = await inquirer.prompt([
          {
            type: 'input',
            name: 'tokenAddress',
            message: 'Inserisci l\'indirizzo del token:'
          }
        ]);
        
        // Carica keypair
        const keypairPath = './keypair.json';
        if (!(await fs.pathExists(keypairPath))) {
          console.log(chalk.red('❌ Keypair non trovata. Genera prima un token.'));
          return;
        }
        
        const keypairData = await fs.readJson(keypairPath);
        const { Keypair } = require('@solana/web3.js');
        const payer = Keypair.fromSecretKey(new Uint8Array(keypairData));
        
        await this.dexManager.initialize(tokenAddress, payer);
      }
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Seleziona operazione DEX:',
          choices: [
            { name: '🌊 Crea Pool Raydium', value: 'raydium' },
            { name: '🐋 Crea Pool Orca', value: 'orca' },
            { name: '🪐 Registra su Jupiter', value: 'jupiter' },
            { name: '🔒 Blocca Liquidità', value: 'lock' },
            { name: '📊 Monitora Pool', value: 'monitor' },
            { name: '🔙 Torna al Menu', value: 'back' }
          ]
        }
      ]);
      
      switch (action) {
        case 'raydium':
          await this.dexManager.createRaydiumPool();
          break;
        case 'orca':
          await this.dexManager.createOrcaPool();
          break;
        case 'jupiter':
          await this.dexManager.registerOnJupiter();
          break;
        case 'lock':
          await this.dexManager.lockLiquidity('simulated_pool_address');
          break;
        case 'monitor':
          await this.dexManager.monitorPools();
          break;
        case 'back':
          return;
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Errore gestione DEX:'), error.message);
      logger.error('DEX management failed', error);
    }
  }

  // Visualizza statistiche
  async showStatistics() {
    try {
      console.log(chalk.blue('📊 === STATISTICHE SISTEMA === 📊'));
      console.log('');
      
      // Statistiche log
      await logger.showStats();
      console.log('');
      
      // Stato monitoraggio
      if (this.monitor.tokenMint) {
        const status = this.monitor.getStatus();
        console.log(chalk.blue('📈 Stato Monitoraggio:'));
        console.log(chalk.white(`   🎯 Token: ${status.tokenMint}`));
        console.log(chalk.white(`   ⚡ Attivo: ${status.isMonitoring ? 'Sì' : 'No'}`));
        console.log(chalk.white(`   🚨 Alert: ${status.alertsCount}`));
        console.log(chalk.white(`   🕐 Ultimo aggiornamento: ${status.lastUpdate || 'Mai'}`));
        
        if (status.metrics.price) {
          console.log('');
          console.log(chalk.blue('💰 Metriche Correnti:'));
          console.log(chalk.white(`   💵 Prezzo: $${status.metrics.price.toFixed(6)}`));
          console.log(chalk.white(`   📊 Market Cap: $${status.metrics.marketCap?.toLocaleString() || 'N/A'}`));
          console.log(chalk.white(`   👥 Holders: ${status.metrics.holders?.toLocaleString() || 'N/A'}`));
          console.log(chalk.white(`   💧 Liquidità: $${status.metrics.liquidity?.toLocaleString() || 'N/A'}`));
        }
      }
      
      // Statistiche file
      console.log('');
      console.log(chalk.blue('📁 File Sistema:'));
      
      const files = [
        { path: './token-info.json', name: 'Info Token' },
        { path: './data/historical_metrics.json', name: 'Metriche Storiche' },
        { path: './data/alerts.json', name: 'Alert' },
        { path: './logs/lunacoin.log', name: 'Log Principale' }
      ];
      
      for (const file of files) {
        const exists = await fs.pathExists(file.path);
        const status = exists ? '✅' : '❌';
        console.log(chalk.white(`   ${status} ${file.name}: ${file.path}`));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Errore visualizzazione statistiche:'), error.message);
    }
  }

  // Visualizza report
  async showReports() {
    try {
      const reportsDir = './reports';
      
      if (!(await fs.pathExists(reportsDir))) {
        console.log(chalk.yellow('📋 Nessun report disponibile'));
        return;
      }
      
      const files = await fs.readdir(reportsDir);
      const reportFiles = files.filter(f => f.endsWith('.json'));
      
      if (reportFiles.length === 0) {
        console.log(chalk.yellow('📋 Nessun report disponibile'));
        return;
      }
      
      const { selectedReport } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedReport',
          message: 'Seleziona report da visualizzare:',
          choices: reportFiles.map(f => ({ name: f, value: f }))
        }
      ]);
      
      const reportPath = `${reportsDir}/${selectedReport}`;
      const report = await fs.readJson(reportPath);
      
      console.log(chalk.blue(`📋 Report: ${selectedReport}`));
      console.log(chalk.white(JSON.stringify(report, null, 2)));
      
    } catch (error) {
      console.error(chalk.red('❌ Errore visualizzazione report:'), error.message);
    }
  }

  // Loop principale
  async run() {
    try {
      this.showBanner();
      
      // Inizializzazione sistema
      console.log(chalk.blue('🔧 Inizializzazione sistema...'));
      await logger.info('Lunacoin System started');
      
      while (true) {
        console.log('');
        const action = await this.showMainMenu();
        console.log('');
        
        switch (action) {
          case 'generate':
            await this.generateToken();
            break;
            
          case 'monitor':
            await this.monitorExistingToken();
            break;
            
          case 'validate':
            const isValid = await TokenValidator.validateToken(config.token);
            console.log(isValid ? 
              chalk.green('✅ Token valido') : 
              chalk.red('❌ Token non valido')
            );
            break;
            
          case 'dex':
            await this.manageDEX();
            break;
            
          case 'stats':
            await this.showStatistics();
            break;
            
          case 'config':
            console.log(chalk.blue('⚙️  Configurazione corrente:'));
            console.log(chalk.white(JSON.stringify(config, null, 2)));
            break;
            
          case 'reports':
            await this.showReports();
            break;
            
          case 'exit':
            console.log(chalk.yellow('👋 Arresto sistema...'));
            
            // Ferma monitoraggio se attivo
            if (this.monitor.isMonitoring) {
              this.monitor.stopMonitoring();
            }
            
            await logger.info('Lunacoin System stopped');
            console.log(chalk.green('✅ Sistema arrestato correttamente'));
            process.exit(0);
            
          default:
            console.log(chalk.red('❌ Azione non riconosciuta'));
        }
        
        // Pausa prima del prossimo menu
        await inquirer.prompt([
          {
            type: 'input',
            name: 'continue',
            message: 'Premi INVIO per continuare...'
          }
        ]);
      }
      
    } catch (error) {
      console.error(chalk.red('💥 ERRORE CRITICO DEL SISTEMA:'), error.message);
      logger.error('System critical error', error);
      process.exit(1);
    }
  }
}

// Gestione segnali di sistema
process.on('SIGINT', async () => {
  console.log('\n' + chalk.yellow('🛑 Arresto sistema in corso...'));
  await logger.info('System shutdown requested');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n' + chalk.yellow('🛑 Arresto sistema in corso...'));
  await logger.info('System terminated');
  process.exit(0);
});

// Gestione errori non catturati
process.on('uncaughtException', async (error) => {
  console.error(chalk.red('💥 ERRORE NON GESTITO:'), error.message);
  await logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error(chalk.red('💥 PROMISE RIFIUTATA:'), reason);
  await logger.error('Unhandled promise rejection', reason);
  process.exit(1);
});

// Avvio sistema se eseguito direttamente
if (require.main === module) {
  const system = new LunacoinSystem();
  system.run();
}

module.exports = LunacoinSystem;