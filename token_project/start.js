#!/usr/bin/env node

const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const LunacoinSystem = require('./index');
const SystemTester = require('./test');

class SystemLauncher {
  constructor() {
    this.system = new LunacoinSystem();
    this.tester = new SystemTester();
  }

  // Mostra banner di avvio
  showStartupBanner() {
    console.clear();
    console.log(chalk.magenta('🌙'.repeat(60)));
    console.log(chalk.magenta('🌙') + chalk.white('                                                          ') + chalk.magenta('🌙'));
    console.log(chalk.magenta('🌙') + chalk.cyan('              LUNACOIN AUTONOMOUS SYSTEM                  ') + chalk.magenta('🌙'));
    console.log(chalk.magenta('🌙') + chalk.yellow('                Sistema Autonomo SPL Token                ') + chalk.magenta('🌙'));
    console.log(chalk.magenta('🌙') + chalk.white('                                                          ') + chalk.magenta('🌙'));
    console.log(chalk.magenta('🌙'.repeat(60)));
    console.log('');
    console.log(chalk.blue('🚀 Benvenuto nel Sistema Autonomo LUNACOIN!'));
    console.log(chalk.white('   Il sistema più avanzato per la creazione e gestione di token SPL su Solana'));
    console.log('');
    console.log(chalk.green('✨ Caratteristiche:'));
    console.log(chalk.white('   🎯 Generazione automatica token SPL'));
    console.log(chalk.white('   🔍 Validazione unicità nome e simbolo'));
    console.log(chalk.white('   🌊 Listing automatico sui DEX (Raydium, Orca, Jupiter)'));
    console.log(chalk.white('   🔒 Gestione sicurezza e liquidità'));
    console.log(chalk.white('   📊 Monitoraggio continuo e alert'));
    console.log(chalk.white('   🔧 Correzioni automatiche'));
    console.log(chalk.white('   💾 Sistema di backup completo'));
    console.log('');
  }

  // Menu di avvio
  async showStartupMenu() {
    const choices = [
      {
        name: '🚀 Avvia Sistema Completo',
        value: 'start',
        short: 'Avvia'
      },
      {
        name: '🧪 Esegui Test Sistema',
        value: 'test',
        short: 'Test'
      },
      {
        name: '⚙️  Verifica Configurazione',
        value: 'config',
        short: 'Config'
      },
      {
        name: '📋 Visualizza Documentazione',
        value: 'docs',
        short: 'Docs'
      },
      {
        name: '🔧 Setup Iniziale',
        value: 'setup',
        short: 'Setup'
      },
      {
        name: '❌ Esci',
        value: 'exit',
        short: 'Esci'
      }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Seleziona un\'opzione:',
        choices,
        pageSize: 10
      }
    ]);

    return action;
  }

  // Verifica prerequisiti
  async checkPrerequisites() {
    console.log(chalk.blue('🔍 Verifica prerequisiti...'));
    
    const checks = [];
    
    // Verifica Node.js
    const nodeVersion = process.version;
    const nodeVersionNum = parseInt(nodeVersion.slice(1).split('.')[0]);
    checks.push({
      name: 'Node.js Version',
      status: nodeVersionNum >= 16,
      message: `${nodeVersion} ${nodeVersionNum >= 16 ? '✅' : '❌ (Richiesto >= 16)'}`
    });
    
    // Verifica dipendenze
    const packageJson = await fs.readJson('./package.json');
    const dependencies = Object.keys(packageJson.dependencies || {});
    let missingDeps = 0;
    
    for (const dep of dependencies) {
      try {
        require(dep);
      } catch (error) {
        missingDeps++;
      }
    }
    
    checks.push({
      name: 'Dipendenze NPM',
      status: missingDeps === 0,
      message: `${dependencies.length - missingDeps}/${dependencies.length} installate ${missingDeps === 0 ? '✅' : '❌'}`
    });
    
    // Verifica directory
    const requiredDirs = ['./data', './logs', './reports', './backups'];
    let existingDirs = 0;
    
    for (const dir of requiredDirs) {
      if (await fs.pathExists(dir)) {
        existingDirs++;
      }
    }
    
    checks.push({
      name: 'Directory Sistema',
      status: existingDirs === requiredDirs.length,
      message: `${existingDirs}/${requiredDirs.length} create ${existingDirs === requiredDirs.length ? '✅' : '❌'}`
    });
    
    // Verifica file configurazione
    const configExists = await fs.pathExists('./config.js');
    checks.push({
      name: 'File Configurazione',
      status: configExists,
      message: configExists ? 'Presente ✅' : 'Mancante ❌'
    });
    
    // Mostra risultati
    console.log('');
    console.log(chalk.blue('📋 Risultati Verifica:'));
    
    for (const check of checks) {
      const icon = check.status ? '✅' : '❌';
      const color = check.status ? 'green' : 'red';
      console.log(chalk[color](`   ${icon} ${check.name}: ${check.message}`));
    }
    
    const allPassed = checks.every(check => check.status);
    
    console.log('');
    if (allPassed) {
      console.log(chalk.green('🎉 Tutti i prerequisiti sono soddisfatti!'));
    } else {
      console.log(chalk.yellow('⚠️  Alcuni prerequisiti non sono soddisfatti.'));
      console.log(chalk.white('   Esegui "npm install" e riprova.'));
    }
    
    return allPassed;
  }

  // Setup iniziale
  async performInitialSetup() {
    console.log(chalk.blue('🔧 === SETUP INIZIALE === 🔧'));
    console.log('');
    
    // Crea directory necessarie
    console.log(chalk.blue('📁 Creazione directory...'));
    const directories = ['./data', './logs', './reports', './backups'];
    
    for (const dir of directories) {
      await fs.ensureDir(dir);
      console.log(chalk.green(`   ✅ ${dir}`));
    }
    
    // Verifica file .env
    if (!(await fs.pathExists('./.env'))) {
      console.log('');
      console.log(chalk.blue('⚙️  Configurazione ambiente...'));
      
      const { createEnv } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createEnv',
          message: 'Creare file .env dalla template?',
          default: true
        }
      ]);
      
      if (createEnv) {
        await fs.copy('./.env.example', './.env');
        console.log(chalk.green('   ✅ File .env creato'));
        console.log(chalk.yellow('   ⚠️  Ricorda di configurare le variabili in .env'));
      }
    }
    
    // Verifica keypair
    const keypairExists = await fs.pathExists('./keypair.json');
    
    if (!keypairExists) {
      console.log('');
      console.log(chalk.blue('🔑 Generazione keypair...'));
      
      const { generateKeypair } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'generateKeypair',
          message: 'Generare nuovo keypair Solana?',
          default: true
        }
      ]);
      
      if (generateKeypair) {
        const { Keypair } = require('@solana/web3.js');
        const keypair = Keypair.generate();
        
        await fs.writeJson('./keypair.json', Array.from(keypair.secretKey), { spaces: 2 });
        
        console.log(chalk.green('   ✅ Keypair generato'));
        console.log(chalk.white(`   📍 Indirizzo: ${keypair.publicKey.toString()}`));
        console.log(chalk.yellow('   ⚠️  IMPORTANTE: Salva il keypair in modo sicuro!'));
      }
    }
    
    console.log('');
    console.log(chalk.green('🎉 Setup completato con successo!'));
  }

  // Mostra documentazione
  async showDocumentation() {
    console.log(chalk.blue('📋 === DOCUMENTAZIONE LUNACOIN === 📋'));
    console.log('');
    
    console.log(chalk.cyan('🚀 AVVIO RAPIDO:'));
    console.log(chalk.white('   1. Esegui "node start.js"'));
    console.log(chalk.white('   2. Seleziona "Setup Iniziale" se è la prima volta'));
    console.log(chalk.white('   3. Configura il file .env con le tue API key'));
    console.log(chalk.white('   4. Avvia il sistema completo'));
    console.log('');
    
    console.log(chalk.cyan('⚙️  CONFIGURAZIONE:'));
    console.log(chalk.white('   • config.js: Configurazione principale del token'));
    console.log(chalk.white('   • .env: Variabili d\'ambiente e API key'));
    console.log(chalk.white('   • keypair.json: Chiavi del wallet (MANTIENI SICURO!)'));
    console.log('');
    
    console.log(chalk.cyan('📁 STRUTTURA FILE:'));
    console.log(chalk.white('   • /data: Dati del sistema e metriche'));
    console.log(chalk.white('   • /logs: File di log del sistema'));
    console.log(chalk.white('   • /reports: Report e statistiche'));
    console.log(chalk.white('   • /backups: Backup automatici'));
    console.log('');
    
    console.log(chalk.cyan('🔧 COMANDI UTILI:'));
    console.log(chalk.white('   • node start.js: Avvia il launcher'));
    console.log(chalk.white('   • node index.js: Avvia direttamente il sistema'));
    console.log(chalk.white('   • node test.js: Esegui test del sistema'));
    console.log(chalk.white('   • npm run generate: Genera token'));
    console.log(chalk.white('   • npm run monitor: Avvia monitoraggio'));
    console.log('');
    
    console.log(chalk.cyan('🌐 NETWORK SUPPORTATI:'));
    console.log(chalk.white('   • Mainnet: Produzione (richiede SOL reali)'));
    console.log(chalk.white('   • Devnet: Test (SOL gratuiti dal faucet)'));
    console.log(chalk.white('   • Testnet: Test avanzati'));
    console.log('');
    
    console.log(chalk.cyan('🔒 SICUREZZA:'));
    console.log(chalk.white('   • Non condividere mai il keypair.json'));
    console.log(chalk.white('   • Usa sempre backup crittografati'));
    console.log(chalk.white('   • Verifica sempre gli indirizzi dei contratti'));
    console.log(chalk.white('   • Testa sempre su devnet prima di mainnet'));
    console.log('');
    
    console.log(chalk.cyan('📞 SUPPORTO:'));
    console.log(chalk.white('   • Controlla i log in ./logs/ per errori'));
    console.log(chalk.white('   • Esegui test.js per diagnosticare problemi'));
    console.log(chalk.white('   • Verifica la configurazione in config.js'));
    console.log('');
  }

  // Verifica configurazione
  async checkConfiguration() {
    console.log(chalk.blue('⚙️  === VERIFICA CONFIGURAZIONE === ⚙️'));
    console.log('');
    
    try {
      const config = require('./config');
      
      console.log(chalk.blue('🎯 Configurazione Token:'));
      console.log(chalk.white(`   Nome: ${config.token.name}`));
      console.log(chalk.white(`   Simbolo: ${config.token.symbol}`));
      console.log(chalk.white(`   Decimali: ${config.token.decimals}`));
      console.log(chalk.white(`   Supply: ${config.token.totalSupply.toLocaleString()}`));
      console.log('');
      
      console.log(chalk.blue('🌐 Configurazione Solana:'));
      console.log(chalk.white(`   Network: ${config.solana.network}`));
      console.log(chalk.white(`   RPC URL: ${config.solana.rpcUrl}`));
      console.log('');
      
      console.log(chalk.blue('🌊 Configurazione DEX:'));
      console.log(chalk.white(`   Raydium: ${config.dex.raydium.enabled ? 'Abilitato' : 'Disabilitato'}`));
      console.log(chalk.white(`   Orca: ${config.dex.orca.enabled ? 'Abilitato' : 'Disabilitato'}`));
      console.log(chalk.white(`   Jupiter: ${config.dex.jupiter.enabled ? 'Abilitato' : 'Disabilitato'}`));
      console.log('');
      
      console.log(chalk.blue('🔒 Configurazione Sicurezza:'));
      console.log(chalk.white(`   Lock Liquidità: ${config.security.liquidityLock ? 'Sì' : 'No'}`));
      console.log(chalk.white(`   Rinuncia Autorità: ${config.security.renounceAuthorities ? 'Sì' : 'No'}`));
      console.log('');
      
      // Verifica file .env
      if (await fs.pathExists('./.env')) {
        console.log(chalk.green('✅ File .env presente'));
      } else {
        console.log(chalk.yellow('⚠️  File .env mancante'));
      }
      
      // Verifica keypair
      if (await fs.pathExists('./keypair.json')) {
        console.log(chalk.green('✅ Keypair presente'));
      } else {
        console.log(chalk.yellow('⚠️  Keypair mancante'));
      }
      
    } catch (error) {
      console.log(chalk.red('❌ Errore nel caricamento configurazione:'));
      console.log(chalk.red(`   ${error.message}`));
    }
  }

  // Avvia il sistema
  async run() {
    try {
      this.showStartupBanner();
      
      while (true) {
        console.log('');
        const action = await this.showStartupMenu();
        console.log('');
        
        switch (action) {
          case 'start':
            // Verifica prerequisiti prima di avviare
            const prerequisitesPassed = await this.checkPrerequisites();
            
            if (!prerequisitesPassed) {
              console.log(chalk.yellow('⚠️  Risolvi i problemi sopra prima di continuare.'));
              break;
            }
            
            console.log(chalk.green('🚀 Avvio sistema...'));
            await this.system.run();
            return; // Il sistema prende il controllo
            
          case 'test':
            console.log(chalk.blue('🧪 Esecuzione test...'));
            const testResult = await this.tester.runAllTests();
            
            if (testResult) {
              console.log(chalk.green('🎉 Tutti i test sono passati! Il sistema è pronto.'));
            } else {
              console.log(chalk.yellow('⚠️  Alcuni test sono falliti. Controlla i dettagli sopra.'));
            }
            break;
            
          case 'config':
            await this.checkConfiguration();
            break;
            
          case 'docs':
            await this.showDocumentation();
            break;
            
          case 'setup':
            await this.performInitialSetup();
            break;
            
          case 'exit':
            console.log(chalk.yellow('👋 Arrivederci!'));
            process.exit(0);
            
          default:
            console.log(chalk.red('❌ Opzione non riconosciuta'));
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
      console.error(chalk.red('💥 ERRORE CRITICO DEL LAUNCHER:'), error.message);
      process.exit(1);
    }
  }
}

// Gestione segnali di sistema
process.on('SIGINT', () => {
  console.log('\n' + chalk.yellow('👋 Arresto launcher...'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n' + chalk.yellow('👋 Arresto launcher...'));
  process.exit(0);
});

// Avvio launcher se eseguito direttamente
if (require.main === module) {
  const launcher = new SystemLauncher();
  launcher.run();
}

module.exports = SystemLauncher;