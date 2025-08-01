import axios from 'axios';

class RealDataService {
  constructor() {
    // Usa variabile d'ambiente per il backend, fallback a localhost per sviluppo
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:10000';
    this.baseUrl = `${backendUrl}/api`;
    this.phantomUrl = 'http://localhost:3000/api';
  }

  // Legge i dati reali dal sistema
  async getRealSystemStats() {
    try {
      // Connessione al backend reale
      const response = await axios.get(`${this.baseUrl}/system/stats`);
      return response.data;
    } catch (error) {
      console.error('❌ Backend non disponibile:', error.message);
      throw new Error('Impossibile connettersi al backend. Verificare che il server sia in esecuzione.');
    }
  }

  // Legge i log reali delle operazioni
  async getRealLogs() {
    try {
      // Connessione al backend reale
      const response = await axios.get(`${this.baseUrl}/system/logs`);
      return response.data;
    } catch (error) {
      console.error('❌ Backend non disponibile per i log:', error.message);
      throw new Error('Impossibile recuperare i log dal backend.');
    }
  }

  // Legge la configurazione reale
  async getRealConfig() {
    try {
      // Prova a connettersi al backend reale
      const response = await axios.get(`${this.baseUrl}/system/config`);
      return response.data;
    } catch (error) {
      console.warn('Backend non disponibile per la config, uso dati di fallback:', error.message);
      
      // Fallback alla configurazione mock
      return this.getDefaultConfig();
    }
  }

  // Avvia la generazione di token reali
  async startTokenGeneration(count = 1) {
    try {
      const response = await axios.post(`${this.baseUrl}/token/generate`, {
        count: count,
        autoList: true
      });
      return response.data;
    } catch (error) {
      console.error('Errore nell\'avvio generazione token:', error);
      throw new Error(`Impossibile avviare la generazione: ${error.message}`);
    }
  }

  // Ferma il sistema
  async stopSystem() {
    try {
      const response = await axios.post(`${this.baseUrl}/system/stop`);
      return response.data;
    } catch (error) {
      console.error('Errore nel fermare il sistema:', error);
      throw new Error(`Impossibile fermare il sistema: ${error.message}`);
    }
  }

  // Ottiene la lista dei token reali creati
  async getRealTokens() {
    try {
      const response = await axios.get(`${this.baseUrl}/tokens`);
      return response.data;
    } catch (error) {
      console.error('❌ Backend non disponibile per i token:', error.message);
      throw new Error('Impossibile recuperare i token dal backend.');
    }
  }

  // Formatta le statistiche del sistema
  formatSystemStats(data) {
    return {
      isRunning: true,
      startTime: data.stats.startTime,
      runtime: Date.now() - data.stats.startTime,
      tokensCreated: data.tokens.created,
      successRate: data.stats.performance.successRate,
      totalCycles: data.tokens.cycles,
      avgTokensPerCycle: data.stats.performance.avgTokensPerCycle,
      avgCycleTime: data.stats.performance.avgCycleTime,
      errors: data.stats.errors,
      successes: data.stats.successes,
      monitoring: data.monitoring,
      dexStats: data.dexStats
    };
  }

  // Configurazione di default
  getDefaultStats() {
    const now = Date.now();
    return {
      isRunning: false,
      startTime: now - 3600000, // 1 ora fa
      runtime: 3600000,
      tokensCreated: 15,
      successRate: 87.5,
      totalCycles: 8,
      avgTokensPerCycle: 1.9,
      avgCycleTime: 450,
      errors: [0, 1, 0, 1, 0, 0, 2],
      successes: [2, 1, 3, 1, 2, 2, 1, 3],
      monitoring: {
        monitoring: {
          isRunning: false,
          totalChecks: 89
        },
        tokens: {
          healthy: 13
        },
        health: {
          totalIssues: 2,
          autoFixEnabled: true
        }
      },
      dexStats: {
        totalTokens: 15,
        totalLiquidity: 125000
      }
    };
  }

  getDefaultConfig() {
    return {
      tokenGeneration: {
        totalLiquidity: 100,
        minTokensPerCycle: 1,
        maxTokensPerCycle: 5,
        cycleInterval: 900000
      },
      daoGovernance: {
        votingPeriod: 604800000,
        quorum: 51,
        proposalThreshold: 1000
      },
      dexManagement: {
        autoListing: true,
        liquidityThreshold: 10,
        priceImpactLimit: 5
      },
      monitoring: {
        healthCheckInterval: 300000,
        alertThreshold: 3,
        autoRecovery: true
      },
      performance: {
        maxConcurrentOperations: 3,
        retryAttempts: 3,
        timeoutMs: 30000
      },
      solana: {
        rpcUrl: 'https://api.devnet.solana.com',
        commitment: 'confirmed'
      }
    };
  }

  // Metodi per Phantom Wallet
  async getPhantomConfig() {
    try {
      const response = await axios.get(`${this.phantomUrl}/wallet-config`);
      return response.data;
    } catch (error) {
      console.warn('Errore caricamento configurazione Phantom:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getPhantomBalance() {
    try {
      const response = await axios.get(`${this.phantomUrl}/my-balance`);
      return response.data;
    } catch (error) {
      console.warn('Errore caricamento saldo Phantom:', error.message);
      return { success: false, error: error.message };
    }
  }

  async requestAirdrop(publicKey) {
    try {
      const response = await axios.post(`${this.phantomUrl}/airdrop`, {
        publicKey: publicKey
      });
      return response.data;
    } catch (error) {
      console.warn('Errore richiesta airdrop:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Istanza singleton del servizio
export const realDataService = new RealDataService();
export default RealDataService;