const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class Logger {
  constructor() {
    this.logDir = './logs';
    this.logFile = path.join(this.logDir, 'lunacoin.log');
    this.errorFile = path.join(this.logDir, 'errors.log');
    this.auditFile = path.join(this.logDir, 'audit.log');
    
    this.ensureLogDirectory();
  }

  // Assicura che la directory dei log esista
  async ensureLogDirectory() {
    try {
      await fs.ensureDir(this.logDir);
    } catch (error) {
      console.error('Errore nella creazione della directory log:', error);
    }
  }

  // Formatta il timestamp
  getTimestamp() {
    return new Date().toISOString();
  }

  // Scrive nel file di log
  async writeToFile(filename, level, message, data = null) {
    try {
      const logEntry = {
        timestamp: this.getTimestamp(),
        level: level.toUpperCase(),
        message,
        data
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(filename, logLine);
    } catch (error) {
      console.error('Errore nella scrittura del log:', error);
    }
  }

  // Log di informazioni generali
  async info(message, data = null) {
    console.log(chalk.blue(`[INFO] ${message}`));
    await this.writeToFile(this.logFile, 'info', message, data);
  }

  // Log di avvertimenti
  async warn(message, data = null) {
    console.log(chalk.yellow(`[WARN] ${message}`));
    await this.writeToFile(this.logFile, 'warn', message, data);
  }

  // Log di errori
  async error(message, error = null) {
    console.log(chalk.red(`[ERROR] ${message}`));
    
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null;
    
    await this.writeToFile(this.logFile, 'error', message, errorData);
    await this.writeToFile(this.errorFile, 'error', message, errorData);
  }

  // Log di debug
  async debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.gray(`[DEBUG] ${message}`));
    }
    await this.writeToFile(this.logFile, 'debug', message, data);
  }

  // Log di successo
  async success(message, data = null) {
    console.log(chalk.green(`[SUCCESS] ${message}`));
    await this.writeToFile(this.logFile, 'success', message, data);
  }

  // Log di audit per operazioni critiche
  async audit(operation, details = null) {
    const auditEntry = {
      timestamp: this.getTimestamp(),
      operation,
      details,
      user: process.env.USER || 'system'
    };
    
    console.log(chalk.magenta(`[AUDIT] ${operation}`));
    await this.writeToFile(this.auditFile, 'audit', operation, auditEntry);
  }

  // Log delle transazioni blockchain
  async transaction(type, txHash, details = null) {
    const txEntry = {
      type,
      txHash,
      details,
      timestamp: this.getTimestamp()
    };
    
    console.log(chalk.cyan(`[TX] ${type}: ${txHash}`));
    await this.writeToFile(this.logFile, 'transaction', `${type}: ${txHash}`, txEntry);
  }

  // Log delle operazioni DEX
  async dex(exchange, operation, details = null) {
    const dexEntry = {
      exchange,
      operation,
      details,
      timestamp: this.getTimestamp()
    };
    
    console.log(chalk.blue(`[DEX] ${exchange}: ${operation}`));
    await this.writeToFile(this.logFile, 'dex', `${exchange}: ${operation}`, dexEntry);
  }

  // Log del monitoraggio
  async monitor(metric, value, threshold = null) {
    const monitorEntry = {
      metric,
      value,
      threshold,
      timestamp: this.getTimestamp()
    };
    
    const color = threshold && value > threshold ? chalk.red : chalk.green;
    console.log(color(`[MONITOR] ${metric}: ${value}`));
    
    await this.writeToFile(this.logFile, 'monitor', `${metric}: ${value}`, monitorEntry);
  }

  // Pulisce i log vecchi
  async cleanOldLogs(daysToKeep = 30) {
    try {
      const files = await fs.readdir(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.remove(filePath);
          console.log(chalk.yellow(`Log file rimosso: ${file}`));
        }
      }
    } catch (error) {
      console.error('Errore nella pulizia dei log:', error);
    }
  }

  // Esporta i log in formato CSV
  async exportToCsv(outputFile = './logs/export.csv') {
    try {
      const logContent = await fs.readFile(this.logFile, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      const csvLines = ['timestamp,level,message,data'];
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const csvLine = [
            entry.timestamp,
            entry.level,
            `"${entry.message.replace(/"/g, '""')}"`,
            entry.data ? `"${JSON.stringify(entry.data).replace(/"/g, '""')}"` : ''
          ].join(',');
          
          csvLines.push(csvLine);
        } catch (parseError) {
          // Ignora le righe malformate
        }
      }
      
      await fs.writeFile(outputFile, csvLines.join('\n'));
      console.log(chalk.green(`Log esportati in: ${outputFile}`));
      
    } catch (error) {
      console.error('Errore nell\'esportazione:', error);
    }
  }

  // Ottiene le statistiche dei log
  async getLogStats() {
    try {
      const logContent = await fs.readFile(this.logFile, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      const stats = {
        total: lines.length,
        info: 0,
        warn: 0,
        error: 0,
        success: 0,
        debug: 0,
        transaction: 0,
        dex: 0,
        monitor: 0,
        audit: 0
      };
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (stats.hasOwnProperty(entry.level.toLowerCase())) {
            stats[entry.level.toLowerCase()]++;
          }
        } catch (parseError) {
          // Ignora le righe malformate
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Errore nel calcolo delle statistiche:', error);
      return null;
    }
  }

  // Mostra le statistiche dei log
  async showStats() {
    const stats = await this.getLogStats();
    
    if (stats) {
      console.log(chalk.blue('📊 Statistiche Log:'));
      console.log(chalk.white(`   Totale: ${stats.total}`));
      console.log(chalk.blue(`   Info: ${stats.info}`));
      console.log(chalk.yellow(`   Warning: ${stats.warn}`));
      console.log(chalk.red(`   Errori: ${stats.error}`));
      console.log(chalk.green(`   Successi: ${stats.success}`));
      console.log(chalk.gray(`   Debug: ${stats.debug}`));
      console.log(chalk.cyan(`   Transazioni: ${stats.transaction}`));
      console.log(chalk.blue(`   DEX: ${stats.dex}`));
      console.log(chalk.green(`   Monitor: ${stats.monitor}`));
      console.log(chalk.magenta(`   Audit: ${stats.audit}`));
    }
  }
}

module.exports = new Logger();

// Esecuzione diretta per test
if (require.main === module) {
  const logger = require('./logger');
  
  // Test dei vari tipi di log
  logger.info('Sistema di logging inizializzato');
  logger.warn('Questo è un avvertimento di test');
  logger.error('Questo è un errore di test');
  logger.success('Operazione completata con successo');
  logger.debug('Messaggio di debug');
  logger.audit('Test audit operation');
  logger.transaction('TOKEN_CREATE', '5KJp7z8...');
  logger.dex('Raydium', 'CREATE_POOL');
  logger.monitor('price', 0.001, 0.002);
  
  // Mostra statistiche
  setTimeout(() => {
    logger.showStats();
  }, 1000);
}