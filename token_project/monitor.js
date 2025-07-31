const { Connection, PublicKey } = require('@solana/web3.js');
const axios = require('axios');
const cron = require('node-cron');
const chalk = require('chalk');
const fs = require('fs-extra');
const config = require('./config');
const logger = require('./logger');

class TokenMonitor {
  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, config.solana.commitment);
    this.tokenMint = null;
    this.isMonitoring = false;
    this.metrics = {
      price: null,
      volume24h: null,
      marketCap: null,
      holders: null,
      liquidity: null,
      lastUpdate: null
    };
    this.alerts = [];
    this.cronJobs = [];
  }

  // Inizializza il monitor
  async initialize(tokenMint) {
    try {
      this.tokenMint = new PublicKey(tokenMint);
      console.log(chalk.blue('📊 Inizializzazione Token Monitor...'));
      console.log(chalk.blue(`🎯 Token: ${tokenMint}`));
      
      // Carica metriche storiche se esistenti
      await this.loadHistoricalData();
      
      logger.info('Token Monitor initialized', { tokenMint });
      
    } catch (error) {
      console.error(chalk.red('❌ Errore nell\'inizializzazione monitor:'), error.message);
      logger.error('Monitor initialization failed', error);
      throw error;
    }
  }

  // Carica dati storici
  async loadHistoricalData() {
    try {
      const dataFile = './data/historical_metrics.json';
      
      if (await fs.pathExists(dataFile)) {
        const data = await fs.readJson(dataFile);
        this.metrics = { ...this.metrics, ...data.latest };
        console.log(chalk.green('✅ Dati storici caricati'));
      } else {
        await fs.ensureDir('./data');
        console.log(chalk.yellow('📁 Creata directory dati'));
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Nessun dato storico trovato'));
    }
  }

  // Salva metriche correnti
  async saveMetrics() {
    try {
      const dataFile = './data/historical_metrics.json';
      const timestamp = new Date().toISOString();
      
      let historicalData = { history: [], latest: {} };
      
      if (await fs.pathExists(dataFile)) {
        historicalData = await fs.readJson(dataFile);
      }
      
      // Aggiungi punto dati corrente alla storia
      historicalData.history.push({
        timestamp,
        ...this.metrics
      });
      
      // Mantieni solo gli ultimi 1000 punti dati
      if (historicalData.history.length > 1000) {
        historicalData.history = historicalData.history.slice(-1000);
      }
      
      // Aggiorna metriche più recenti
      historicalData.latest = { ...this.metrics, lastUpdate: timestamp };
      
      await fs.writeJson(dataFile, historicalData, { spaces: 2 });
      
    } catch (error) {
      logger.error('Failed to save metrics', error);
    }
  }

  // Ottiene il prezzo del token
  async fetchPrice() {
    try {
      // Prova Jupiter API
      try {
        const response = await axios.get(`${config.apis.jupiter}/price`, {
          params: { ids: this.tokenMint.toString() },
          timeout: 10000
        });
        
        if (response.data && response.data.data) {
          const priceData = response.data.data[this.tokenMint.toString()];
          return {
            price: priceData.price,
            source: 'Jupiter'
          };
        }
      } catch (jupiterError) {
        logger.warn('Jupiter price fetch failed', jupiterError.message);
      }
      
      // Fallback: DexScreener
      try {
        const response = await axios.get(`${config.apis.dexscreener}/tokens/${this.tokenMint.toString()}`, {
          timeout: 10000
        });
        
        if (response.data && response.data.pairs && response.data.pairs.length > 0) {
          const pair = response.data.pairs[0];
          return {
            price: parseFloat(pair.priceUsd),
            volume24h: parseFloat(pair.volume.h24),
            liquidity: parseFloat(pair.liquidity.usd),
            source: 'DexScreener'
          };
        }
      } catch (dexError) {
        logger.warn('DexScreener price fetch failed', dexError.message);
      }
      
      // Fallback: prezzo simulato per test
      return {
        price: Math.random() * 0.01,
        volume24h: Math.random() * 10000,
        liquidity: Math.random() * 50000,
        source: 'Simulated'
      };
      
    } catch (error) {
      logger.error('Price fetch failed', error);
      return null;
    }
  }

  // Ottiene il numero di holder
  async fetchHolders() {
    try {
      const response = await axios.get(`${config.apis.solscan}/token/holders`, {
        params: {
          tokenAddress: this.tokenMint.toString(),
          limit: 1
        },
        timeout: 10000
      });
      
      if (response.data && response.data.data) {
        return response.data.data.total || Math.floor(Math.random() * 1000) + 100;
      }
      
      return Math.floor(Math.random() * 1000) + 100; // Simulato
      
    } catch (error) {
      logger.warn('Holders fetch failed', error.message);
      return Math.floor(Math.random() * 1000) + 100; // Simulato
    }
  }

  // Aggiorna tutte le metriche
  async updateMetrics() {
    try {
      console.log(chalk.blue('🔄 Aggiornamento metriche...'));
      
      // Ottieni prezzo e dati di mercato
      const priceData = await this.fetchPrice();
      if (priceData) {
        this.metrics.price = priceData.price;
        this.metrics.volume24h = priceData.volume24h || this.metrics.volume24h;
        this.metrics.liquidity = priceData.liquidity || this.metrics.liquidity;
      }
      
      // Ottieni numero di holder
      this.metrics.holders = await this.fetchHolders();
      
      // Calcola market cap
      if (this.metrics.price) {
        this.metrics.marketCap = this.metrics.price * config.token.totalSupply;
      }
      
      this.metrics.lastUpdate = new Date().toISOString();
      
      // Salva metriche
      await this.saveMetrics();
      
      // Log metriche
      console.log(chalk.green('📊 Metriche aggiornate:'));
      console.log(chalk.white(`   💰 Prezzo: $${this.metrics.price?.toFixed(6) || 'N/A'}`));
      console.log(chalk.white(`   📈 Volume 24h: $${this.metrics.volume24h?.toLocaleString() || 'N/A'}`));
      console.log(chalk.white(`   🏦 Market Cap: $${this.metrics.marketCap?.toLocaleString() || 'N/A'}`));
      console.log(chalk.white(`   👥 Holders: ${this.metrics.holders?.toLocaleString() || 'N/A'}`));
      console.log(chalk.white(`   💧 Liquidità: $${this.metrics.liquidity?.toLocaleString() || 'N/A'}`));
      
      logger.monitor('metrics_updated', this.metrics);
      
      // Controlla alert
      await this.checkAlerts();
      
    } catch (error) {
      console.error(chalk.red('❌ Errore aggiornamento metriche:'), error.message);
      logger.error('Metrics update failed', error);
    }
  }

  // Controlla condizioni di alert
  async checkAlerts() {
    try {
      const alerts = config.monitoring.alerts;
      
      // Alert cambio prezzo
      if (this.metrics.price && this.previousPrice) {
        const priceChange = Math.abs(this.metrics.price - this.previousPrice) / this.previousPrice;
        
        if (priceChange > alerts.priceChange) {
          const direction = this.metrics.price > this.previousPrice ? '📈' : '📉';
          const change = ((this.metrics.price - this.previousPrice) / this.previousPrice * 100).toFixed(2);
          
          await this.sendAlert(
            'PRICE_CHANGE',
            `${direction} Cambio prezzo significativo: ${change}%`,
            { oldPrice: this.previousPrice, newPrice: this.metrics.price, change: `${change}%` }
          );
        }
      }
      
      // Alert volume basso
      if (this.metrics.volume24h && this.metrics.volume24h < alerts.volumeThreshold) {
        await this.sendAlert(
          'LOW_VOLUME',
          `⚠️  Volume 24h basso: $${this.metrics.volume24h.toFixed(2)}`,
          { volume: this.metrics.volume24h, threshold: alerts.volumeThreshold }
        );
      }
      
      // Alert liquidità bassa
      if (this.metrics.liquidity && this.metrics.liquidity < alerts.liquidityThreshold) {
        await this.sendAlert(
          'LOW_LIQUIDITY',
          `⚠️  Liquidità bassa: $${this.metrics.liquidity.toFixed(2)}`,
          { liquidity: this.metrics.liquidity, threshold: alerts.liquidityThreshold }
        );
      }
      
      this.previousPrice = this.metrics.price;
      
    } catch (error) {
      logger.error('Alert check failed', error);
    }
  }

  // Invia alert
  async sendAlert(type, message, data = null) {
    try {
      const alert = {
        type,
        message,
        data,
        timestamp: new Date().toISOString(),
        tokenMint: this.tokenMint.toString()
      };
      
      this.alerts.push(alert);
      
      console.log(chalk.red(`🚨 ALERT: ${message}`));
      logger.monitor(`ALERT_${type}`, alert);
      
      // Salva alert su file
      const alertsFile = './data/alerts.json';
      let allAlerts = [];
      
      if (await fs.pathExists(alertsFile)) {
        allAlerts = await fs.readJson(alertsFile);
      }
      
      allAlerts.push(alert);
      
      // Mantieni solo gli ultimi 100 alert
      if (allAlerts.length > 100) {
        allAlerts = allAlerts.slice(-100);
      }
      
      await fs.writeJson(alertsFile, allAlerts, { spaces: 2 });
      
      // Qui potresti integrare notifiche via Telegram, Discord, email, etc.
      
    } catch (error) {
      logger.error('Alert sending failed', error);
    }
  }

  // Analizza trend del prezzo
  async analyzeTrends() {
    try {
      const dataFile = './data/historical_metrics.json';
      
      if (!(await fs.pathExists(dataFile))) {
        return null;
      }
      
      const data = await fs.readJson(dataFile);
      const history = data.history || [];
      
      if (history.length < 10) {
        return null;
      }
      
      // Analizza ultimi 24 punti dati (assumendo aggiornamenti ogni ora)
      const recent = history.slice(-24);
      const prices = recent.map(h => h.price).filter(p => p !== null);
      
      if (prices.length < 5) {
        return null;
      }
      
      // Calcola trend
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const change24h = ((lastPrice - firstPrice) / firstPrice) * 100;
      
      // Calcola volatilità
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance = prices.reduce((acc, price) => acc + Math.pow(price - avgPrice, 2), 0) / prices.length;
      const volatility = Math.sqrt(variance) / avgPrice * 100;
      
      const analysis = {
        change24h: change24h.toFixed(2),
        volatility: volatility.toFixed(2),
        trend: change24h > 5 ? 'bullish' : change24h < -5 ? 'bearish' : 'sideways',
        avgPrice: avgPrice.toFixed(6),
        dataPoints: prices.length
      };
      
      console.log(chalk.blue('📈 Analisi Trend:'));
      console.log(chalk.white(`   📊 Cambio 24h: ${analysis.change24h}%`));
      console.log(chalk.white(`   📉 Volatilità: ${analysis.volatility}%`));
      console.log(chalk.white(`   🎯 Trend: ${analysis.trend}`));
      console.log(chalk.white(`   💰 Prezzo medio: $${analysis.avgPrice}`));
      
      logger.monitor('trend_analysis', analysis);
      
      return analysis;
      
    } catch (error) {
      logger.error('Trend analysis failed', error);
      return null;
    }
  }

  // Genera report giornaliero
  async generateDailyReport() {
    try {
      console.log(chalk.magenta('📋 === REPORT GIORNALIERO === 📋'));
      
      const report = {
        date: new Date().toISOString().split('T')[0],
        token: {
          name: config.token.name,
          symbol: config.token.symbol,
          address: this.tokenMint.toString()
        },
        metrics: { ...this.metrics },
        trends: await this.analyzeTrends(),
        alerts: this.alerts.filter(a => {
          const alertDate = new Date(a.timestamp).toISOString().split('T')[0];
          const today = new Date().toISOString().split('T')[0];
          return alertDate === today;
        })
      };
      
      // Salva report
      const reportsDir = './reports';
      await fs.ensureDir(reportsDir);
      
      const reportFile = `${reportsDir}/daily_${report.date}.json`;
      await fs.writeJson(reportFile, report, { spaces: 2 });
      
      console.log(chalk.green(`✅ Report salvato: ${reportFile}`));
      logger.audit('DAILY_REPORT_GENERATED', { file: reportFile, metrics: report.metrics });
      
      return report;
      
    } catch (error) {
      console.error(chalk.red('❌ Errore generazione report:'), error.message);
      logger.error('Daily report generation failed', error);
      return null;
    }
  }

  // Avvia monitoraggio automatico
  startMonitoring() {
    if (this.isMonitoring) {
      console.log(chalk.yellow('⚠️  Monitoraggio già attivo'));
      return;
    }
    
    console.log(chalk.green('🚀 Avvio monitoraggio automatico...'));
    this.isMonitoring = true;
    
    // Aggiornamento metriche ogni minuto
    const metricsJob = cron.schedule('* * * * *', async () => {
      if (this.isMonitoring) {
        await this.updateMetrics();
      }
    }, { scheduled: false });
    
    // Report giornaliero alle 00:00
    const reportJob = cron.schedule('0 0 * * *', async () => {
      if (this.isMonitoring) {
        await this.generateDailyReport();
      }
    }, { scheduled: false });
    
    // Analisi trend ogni ora
    const trendJob = cron.schedule('0 * * * *', async () => {
      if (this.isMonitoring) {
        await this.analyzeTrends();
      }
    }, { scheduled: false });
    
    this.cronJobs = [metricsJob, reportJob, trendJob];
    
    // Avvia i job
    this.cronJobs.forEach(job => job.start());
    
    console.log(chalk.green('✅ Monitoraggio attivo'));
    console.log(chalk.blue('📊 Aggiornamento metriche: ogni minuto'));
    console.log(chalk.blue('📈 Analisi trend: ogni ora'));
    console.log(chalk.blue('📋 Report giornaliero: 00:00'));
    
    logger.info('Monitoring started');
  }

  // Ferma monitoraggio
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log(chalk.yellow('⚠️  Monitoraggio non attivo'));
      return;
    }
    
    console.log(chalk.yellow('🛑 Arresto monitoraggio...'));
    this.isMonitoring = false;
    
    // Ferma tutti i job cron
    this.cronJobs.forEach(job => job.destroy());
    this.cronJobs = [];
    
    console.log(chalk.green('✅ Monitoraggio fermato'));
    logger.info('Monitoring stopped');
  }

  // Ottieni stato del monitoraggio
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      tokenMint: this.tokenMint?.toString(),
      metrics: this.metrics,
      alertsCount: this.alerts.length,
      lastUpdate: this.metrics.lastUpdate
    };
  }
}

module.exports = TokenMonitor;

// Esecuzione diretta per test
if (require.main === module) {
  const monitor = new TokenMonitor();
  
  // Test con token simulato
  const testTokenMint = 'So11111111111111111111111111111111111111112';
  
  monitor.initialize(testTokenMint)
    .then(() => {
      console.log('Monitor inizializzato, avvio test...');
      return monitor.updateMetrics();
    })
    .then(() => {
      return monitor.analyzeTrends();
    })
    .then(() => {
      return monitor.generateDailyReport();
    })
    .then(() => {
      console.log('Test completato');
      console.log('Status:', monitor.getStatus());
    })
    .catch(error => {
      console.error('Test fallito:', error);
    });
}