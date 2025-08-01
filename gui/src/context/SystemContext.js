import React, { createContext, useContext, useState, useEffect } from 'react';
import { realDataService } from '../services/api';

const SystemContext = createContext();

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem deve essere usato all\'interno di SystemProvider');
  }
  return context;
};

export const SystemProvider = ({ children }) => {
  const [systemStatus, setSystemStatus] = useState({
    tokenGenerator: false,
    dao: false,
    connected: false,
    lastUpdate: null
  });

  const [logs, setLogs] = useState([]);
  const [realStats, setRealStats] = useState(null);
  const [realReports, setRealReports] = useState([]);
  const [phantomWallet, setPhantomWallet] = useState(null);
  const [phantomBalance, setPhantomBalance] = useState(null);

  const [stats, setStats] = useState({
    tokensGenerated: 0,
    totalSupply: 0,
    activeProposals: 0,
    dexListings: 0,
    errors: 0,
    uptime: 0
  });

  const [config, setConfig] = useState({
    solanaRpcUrl: 'https://api.devnet.solana.com',
    totalLiquidity: 100,
    minTokens: 10,
    maxTokens: 50,
    raydiumEnabled: true,
    orcaEnabled: true,
    serumEnabled: true,
    monitoringInterval: 300000,
    autoFixEnabled: true
  });

  // Carica configurazione Phantom
  const loadPhantomData = async () => {
    try {
      const [configResult, balanceResult] = await Promise.all([
        realDataService.getPhantomConfig(),
        realDataService.getPhantomBalance()
      ]);
      
      if (configResult.success) {
        setPhantomWallet(configResult.config);
      }
      
      if (balanceResult.success) {
        setPhantomBalance(balanceResult);
      }
    } catch (error) {
      console.error('Errore caricamento dati Phantom:', error);
    }
  };

  // Carica dati reali dal backend
  const loadRealData = async () => {
    try {
      const [realSystemStats, realLogs, realConfig] = await Promise.all([
        realDataService.getRealSystemStats(),
        realDataService.getRealLogs(),
        realDataService.getRealConfig()
      ]);

      setRealStats(realSystemStats);
      setLogs(realLogs);
      
      // Aggiorna lo stato del sistema con i dati reali
      setSystemStatus(prev => ({
        ...prev,
        tokenGenerator: realSystemStats?.isRunning || false,
        dao: realSystemStats?.monitoring?.monitoring?.isRunning || false,
        connected: true,
        lastUpdate: new Date().toISOString()
      }));

      // Aggiorna le statistiche con i dati reali
      setStats(prev => ({
        ...prev,
        tokensGenerated: realSystemStats?.tokensCreated || 0,
        activeProposals: realSystemStats?.monitoring?.tokens?.healthy || 0,
        dexListings: realSystemStats?.dexStats?.totalTokens || 0,
        errors: realSystemStats?.monitoring?.health?.totalIssues || 0,
        uptime: realSystemStats?.runtime || 0
      }));

      // Aggiorna la configurazione con i dati reali
      setConfig(prev => ({ ...prev, ...realConfig }));
      
      // Aggiungi log di successo
      addLog('system', '✅ Connesso al backend Solana - Dati reali caricati', 'success');
      
    } catch (error) {
      console.error('❌ Errore nel caricamento dati reali:', error);
      setSystemStatus(prev => ({
        ...prev,
        connected: false,
        lastUpdate: new Date().toISOString()
      }));
      
      // Aggiungi log di errore
      addLog('system', '❌ Impossibile connettersi al backend', 'error');
      addLog('system', 'Verificare che il server API sia in esecuzione su porta 10000', 'warning');
    }
  };

  // Funzioni per gestire i log
  const addLog = (component, message, level = 'info') => {
    const timestamp = new Date().toLocaleString('it-IT');
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp,
      message,
      level,
      component
    };

    setLogs(prev => [...prev.slice(-99), logEntry]); // Mantieni solo gli ultimi 100 log
  };

  // Funzioni per gestire le statistiche
  const updateStats = (newStats) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  // Funzioni per gestire la configurazione
  const updateConfig = (newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Carica i dati reali all'avvio e periodicamente
  useEffect(() => {
    loadRealData();
    loadPhantomData();
    
    // Aggiorna i dati ogni 30 secondi
    const interval = setInterval(() => {
      loadRealData();
      loadPhantomData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Funzioni per controllare i servizi
  const startTokenGenerator = async () => {
    try {
      if (window.require && window.require.resolve) {
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('start-token-generator');
        setSystemStatus(prev => ({ ...prev, tokenGenerator: true }));
        addLog('system', 'Token Generator avviato', 'success');
      } else {
        // Modalità web - simula avvio
        setSystemStatus(prev => ({ ...prev, tokenGenerator: true }));
        addLog('system', 'Token Generator avviato (modalità web)', 'success');
      }
    } catch (error) {
      addLog('system', `Errore avvio Token Generator: ${error.message}`, 'error');
    }
  };

  const stopTokenGenerator = async () => {
    try {
      if (window.require && window.require.resolve) {
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('stop-token-generator');
        setSystemStatus(prev => ({ ...prev, tokenGenerator: false }));
        addLog('system', 'Token Generator fermato', 'warning');
      } else {
        setSystemStatus(prev => ({ ...prev, tokenGenerator: false }));
        addLog('system', 'Token Generator fermato (modalità web)', 'warning');
      }
    } catch (error) {
      addLog('system', `Errore stop Token Generator: ${error.message}`, 'error');
    }
  };

  const startDAO = async () => {
    try {
      if (window.require && window.require.resolve) {
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('start-dao');
        setSystemStatus(prev => ({ ...prev, dao: true }));
        addLog('system', 'DAO avviato', 'success');
      } else {
        setSystemStatus(prev => ({ ...prev, dao: true }));
        addLog('system', 'DAO avviato (modalità web)', 'success');
      }
    } catch (error) {
      addLog('system', `Errore avvio DAO: ${error.message}`, 'error');
    }
  };

  const stopDAO = async () => {
    try {
      if (window.require && window.require.resolve) {
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('stop-dao');
        setSystemStatus(prev => ({ ...prev, dao: false }));
        addLog('system', 'DAO fermato', 'warning');
      } else {
        setSystemStatus(prev => ({ ...prev, dao: false }));
        addLog('system', 'DAO fermato (modalità web)', 'warning');
      }
    } catch (error) {
      addLog('system', `Errore stop DAO: ${error.message}`, 'error');
    }
  };

  // Effetto per gestire i listener Electron
  useEffect(() => {
    if (window.require && window.require.resolve) {
      try {
        const { ipcRenderer } = window.require('electron');

        // Listener per i log del token generator
        ipcRenderer.on('token-generator-log', (event, data) => {
          addLog('tokenGenerator', data.trim(), 'info');
        });

        ipcRenderer.on('token-generator-error', (event, data) => {
          addLog('tokenGenerator', data.trim(), 'error');
        });

        // Listener per i log del DAO
        ipcRenderer.on('dao-log', (event, data) => {
          addLog('dao', data.trim(), 'info');
        });

        ipcRenderer.on('dao-error', (event, data) => {
          addLog('dao', data.trim(), 'error');
        });

        // Cleanup
        return () => {
          ipcRenderer.removeAllListeners('token-generator-log');
          ipcRenderer.removeAllListeners('token-generator-error');
          ipcRenderer.removeAllListeners('dao-log');
          ipcRenderer.removeAllListeners('dao-error');
        };
      } catch (error) {
        console.log('Electron non disponibile, modalità web attiva');
      }
    }
  }, []);

  // Aggiorna timestamp ultimo aggiornamento
  useEffect(() => {
    setSystemStatus(prev => ({ ...prev, lastUpdate: new Date() }));
  }, [systemStatus.tokenGenerator, systemStatus.dao]);

  // Funzione per richiedere airdrop
  const requestAirdrop = async () => {
    try {
      if (phantomWallet?.wallet?.publicKey) {
        const result = await realDataService.requestAirdrop(phantomWallet.wallet.publicKey);
        if (result.success) {
          addLog('phantom', `Airdrop richiesto con successo: ${result.signature}`, 'success');
          // Ricarica il saldo dopo l'airdrop
          setTimeout(loadPhantomData, 3000);
        } else {
          addLog('phantom', `Errore airdrop: ${result.error}`, 'error');
        }
        return result;
      } else {
        const error = 'Nessun wallet Phantom configurato';
        addLog('phantom', error, 'error');
        return { success: false, error };
      }
    } catch (error) {
      addLog('phantom', `Errore richiesta airdrop: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  };

  const value = {
    systemStatus,
    setSystemStatus,
    logs,
    addLog,
    stats,
    updateStats,
    config,
    updateConfig,
    startTokenGenerator,
    stopTokenGenerator,
    startDAO,
    stopDAO,
    // Dati reali dal backend
    realStats,
    realReports,
    loadRealData,
    // Dati Phantom Wallet
    phantomWallet,
    phantomBalance,
    loadPhantomData,
    requestAirdrop
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
};

export default SystemContext;