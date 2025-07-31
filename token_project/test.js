#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs-extra');
const config = require('./config');
const logger = require('./logger');
const TokenValidator = require('./tokenValidator');
const TokenGenerator = require('./tokenGenerator');
const DexManager = require('./dexManager');
const TokenMonitor = require('./monitor');
const BackupManager = require('./backup');

class SystemTester {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  // Esegui un singolo test
  async runTest(testName, testFunction) {
    this.totalTests++;
    console.log(chalk.blue(`🧪 Testing: ${testName}`));
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      if (result.success) {
        this.passedTests++;
        console.log(chalk.green(`✅ PASS: ${testName} (${duration}ms)`));
        if (result.message) {
          console.log(chalk.gray(`   ${result.message}`));
        }
      } else {
        this.failedTests++;
        console.log(chalk.red(`❌ FAIL: ${testName} (${duration}ms)`));
        console.log(chalk.red(`   Error: ${result.error}`));
      }
      
      this.testResults.push({
        name: testName,
        success: result.success,
        duration,
        error: result.error,
        message: result.message
      });
      
    } catch (error) {
      this.failedTests++;
      console.log(chalk.red(`❌ FAIL: ${testName} (Exception)`));
      console.log(chalk.red(`   Exception: ${error.message}`));
      
      this.testResults.push({
        name: testName,
        success: false,
        duration: 0,
        error: error.message
      });
    }
    
    console.log('');
  }

  // Test configurazione
  async testConfiguration() {
    return {
      success: true,
      message: `Token: ${config.token.name} (${config.token.symbol}), Network: ${config.solana.network}`
    };
  }

  // Test sistema di logging
  async testLogging() {
    try {
      await logger.info('Test log message');
      await logger.warn('Test warning message');
      await logger.error('Test error message', new Error('Test error'));
      
      // Verifica che i file di log siano stati creati
      const logExists = await fs.pathExists('./logs/lunacoin.log');
      
      if (!logExists) {
        return {
          success: false,
          error: 'Log file not created'
        };
      }
      
      return {
        success: true,
        message: 'Log files created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test validatore token
  async testTokenValidator() {
    try {
      // Test validazione token completo
      const isValid = await TokenValidator.validateToken({
        name: 'TestCoin',
        symbol: 'TEST',
        decimals: 9,
        totalSupply: 1000000,
        description: 'Test token for validation'
      });
      
      return {
        success: true,
        message: `Token validation result: ${isValid ? 'Valid' : 'Invalid'}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test generatore token (modalità test)
  async testTokenGenerator() {
    try {
      const generator = new TokenGenerator();
      
      // Test inizializzazione
      const initResult = await generator.initialize();
      
      if (!initResult) {
        return {
          success: false,
          error: 'Failed to initialize token generator'
        };
      }
      
      // Test verifica balance (dovrebbe essere 0 in devnet)
      const balance = await generator.checkBalance();
      
      return {
        success: true,
        message: `Generator initialized, SOL balance: ${balance} SOL`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test DEX manager
  async testDexManager() {
    try {
      const dexManager = new DexManager();
      
      // Test inizializzazione con dati mock
      const mockTokenAddress = '11111111111111111111111111111112'; // System program ID come mock
      const mockKeypair = require('@solana/web3.js').Keypair.generate();
      
      await dexManager.initialize(mockTokenAddress, mockKeypair);
      
      return {
        success: true,
        message: 'DEX manager initialized successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test monitor
  async testMonitor() {
    try {
      const monitor = new TokenMonitor();
      
      // Test inizializzazione con token mock
      const mockTokenAddress = '11111111111111111111111111111112';
      await monitor.initialize(mockTokenAddress);
      
      // Test stato monitor
      const status = monitor.getStatus();
      
      return {
        success: true,
        message: `Monitor initialized, token: ${status.tokenMint}, monitoring: ${status.isMonitoring}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test backup manager
  async testBackupManager() {
    try {
      const backupManager = new BackupManager();
      
      // Test inizializzazione
      const initResult = await backupManager.initialize();
      
      if (!initResult) {
        return {
          success: false,
          error: 'Failed to initialize backup manager'
        };
      }
      
      // Test lista backup
      const backups = await backupManager.listBackups();
      
      return {
        success: true,
        message: `Backup manager initialized, found ${backups.length} existing backups`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test connessione Solana
  async testSolanaConnection() {
    try {
      const { Connection } = require('@solana/web3.js');
      const connection = new Connection(config.solana.rpcUrl, 'confirmed');
      
      // Test connessione
      const version = await connection.getVersion();
      
      // Test slot corrente
      const slot = await connection.getSlot();
      
      return {
        success: true,
        message: `Connected to Solana ${config.solana.network}, version: ${version['solana-core']}, slot: ${slot}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test creazione directory
  async testDirectoryStructure() {
    try {
      const directories = ['./data', './logs', './reports', './backups'];
      
      for (const dir of directories) {
        await fs.ensureDir(dir);
      }
      
      // Verifica che tutte le directory esistano
      for (const dir of directories) {
        const exists = await fs.pathExists(dir);
        if (!exists) {
          return {
            success: false,
            error: `Directory ${dir} not created`
          };
        }
      }
      
      return {
        success: true,
        message: 'All required directories created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test dipendenze
  async testDependencies() {
    try {
      const requiredPackages = [
        '@solana/web3.js',
        '@solana/spl-token',
        'axios',
        'chalk',
        'inquirer',
        'fs-extra',
        'node-cron'
      ];
      
      const missingPackages = [];
      
      for (const pkg of requiredPackages) {
        try {
          require(pkg);
        } catch (error) {
          missingPackages.push(pkg);
        }
      }
      
      if (missingPackages.length > 0) {
        return {
          success: false,
          error: `Missing packages: ${missingPackages.join(', ')}`
        };
      }
      
      return {
        success: true,
        message: `All ${requiredPackages.length} required packages are available`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test performance
  async testPerformance() {
    try {
      const startTime = Date.now();
      
      // Test operazioni multiple
      const operations = [];
      
      for (let i = 0; i < 100; i++) {
        operations.push(logger.info(`Performance test ${i}`));
      }
      
      await Promise.all(operations);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        message: `100 concurrent log operations completed in ${duration}ms`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Esegui tutti i test
  async runAllTests() {
    console.log(chalk.magenta('🧪'.repeat(60)));
    console.log(chalk.magenta('🧪') + chalk.white('                                                          ') + chalk.magenta('🧪'));
    console.log(chalk.magenta('🧪') + chalk.cyan('                LUNACOIN SYSTEM TESTS                    ') + chalk.magenta('🧪'));
    console.log(chalk.magenta('🧪') + chalk.white('                                                          ') + chalk.magenta('🧪'));
    console.log(chalk.magenta('🧪'.repeat(60)));
    console.log('');
    
    const startTime = Date.now();
    
    // Esegui tutti i test
    await this.runTest('Configuration Loading', () => this.testConfiguration());
    await this.runTest('Dependencies Check', () => this.testDependencies());
    await this.runTest('Directory Structure', () => this.testDirectoryStructure());
    await this.runTest('Logging System', () => this.testLogging());
    await this.runTest('Solana Connection', () => this.testSolanaConnection());
    await this.runTest('Token Validator', () => this.testTokenValidator());
    await this.runTest('Token Generator', () => this.testTokenGenerator());
    await this.runTest('DEX Manager', () => this.testDexManager());
    await this.runTest('Token Monitor', () => this.testMonitor());
    await this.runTest('Backup Manager', () => this.testBackupManager());
    await this.runTest('Performance Test', () => this.testPerformance());
    
    const totalDuration = Date.now() - startTime;
    
    // Mostra risultati finali
    console.log(chalk.blue('📊 === TEST RESULTS === 📊'));
    console.log('');
    console.log(chalk.white(`Total Tests: ${this.totalTests}`));
    console.log(chalk.green(`Passed: ${this.passedTests}`));
    console.log(chalk.red(`Failed: ${this.failedTests}`));
    console.log(chalk.white(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`));
    console.log(chalk.white(`Total Duration: ${totalDuration}ms`));
    console.log('');
    
    // Mostra test falliti
    if (this.failedTests > 0) {
      console.log(chalk.red('❌ Failed Tests:'));
      this.testResults
        .filter(test => !test.success)
        .forEach(test => {
          console.log(chalk.red(`   • ${test.name}: ${test.error}`));
        });
      console.log('');
    }
    
    // Salva report
    await this.saveTestReport(totalDuration);
    
    // Determina stato finale
    const allPassed = this.failedTests === 0;
    
    if (allPassed) {
      console.log(chalk.green('🎉 ALL TESTS PASSED! System is ready for use.'));
    } else {
      console.log(chalk.yellow('⚠️  Some tests failed. Please check the issues above.'));
    }
    
    return allPassed;
  }

  // Salva report dei test
  async saveTestReport(totalDuration) {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalTests: this.totalTests,
          passedTests: this.passedTests,
          failedTests: this.failedTests,
          successRate: (this.passedTests / this.totalTests) * 100,
          totalDuration
        },
        results: this.testResults,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          solanaNetwork: config.solana.network
        }
      };
      
      await fs.ensureDir('./reports');
      const reportPath = `./reports/test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      await fs.writeJson(reportPath, report, { spaces: 2 });
      
      console.log(chalk.blue(`📋 Test report saved: ${reportPath}`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to save test report: ${error.message}`));
    }
  }
}

// Esegui test se chiamato direttamente
if (require.main === module) {
  const tester = new SystemTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('💥 Test runner crashed:'), error.message);
      process.exit(1);
    });
}

module.exports = SystemTester;