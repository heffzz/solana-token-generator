import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AccountBalanceWallet,
  Refresh,
  Download,
  Warning,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';

const PhantomWallet = () => {
  const [phantom, setPhantom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState('devnet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [airdropLoading, setAirdropLoading] = useState(false);

  // Rileva Phantom all'avvio
  useEffect(() => {
    const checkPhantom = () => {
      if (window.solana && window.solana.isPhantom) {
        setPhantom(window.solana);
        // Controlla se già connesso
        if (window.solana.isConnected) {
          setConnected(true);
          setPublicKey(window.solana.publicKey.toString());
          getBalance(window.solana.publicKey.toString());
        }
      }
    };

    if (window.solana) {
      checkPhantom();
    } else {
      // Aspetta che Phantom si carichi
      const interval = setInterval(() => {
        if (window.solana) {
          checkPhantom();
          clearInterval(interval);
        }
      }, 100);

      // Timeout dopo 5 secondi
      setTimeout(() => {
        clearInterval(interval);
      }, 5000);
    }
  }, []);

  // Connetti a Phantom
  const connectPhantom = async () => {
    if (!phantom) {
      setError('Phantom Wallet non trovato. Installa l\'estensione da phantom.app');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await phantom.connect();
      setConnected(true);
      setPublicKey(response.publicKey.toString());
      await getBalance(response.publicKey.toString());
      
    } catch (err) {
      setError('Connessione a Phantom fallita: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Disconnetti da Phantom
  const disconnectPhantom = async () => {
    if (phantom) {
      try {
        await phantom.disconnect();
        setConnected(false);
        setPublicKey(null);
        setBalance(null);
        setError(null);
      } catch (err) {
        setError('Errore durante la disconnessione: ' + err.message);
      }
    }
  };

  // Ottieni saldo
  const getBalance = async (walletAddress = publicKey) => {
    if (!walletAddress) {
      console.log('Nessun indirizzo wallet fornito');
      return;
    }

    // Validazione base58 per chiave pubblica Solana
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(walletAddress) || walletAddress.length < 32 || walletAddress.length > 44) {
      setError('Indirizzo wallet non valido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`Recupero saldo per: ${walletAddress} su rete: ${network}`);
      
      // Usa il servizio API invece di fetch diretto
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/phantom/balance/${walletAddress}/${network}`);
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.balance);
        console.log(`Saldo recuperato: ${data.balance} SOL`);
      } else {
        setError('Errore nel recupero del saldo: ' + data.error);
        console.error('Errore API:', data.error);
      }
    } catch (err) {
      setError('Errore di connessione al server: ' + err.message);
      console.error('Errore fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  // Richiedi airdrop (solo devnet)
  const requestAirdrop = async () => {
    if (!publicKey || network !== 'devnet') {
      setError('Airdrop disponibile solo su devnet con wallet connesso');
      return;
    }

    // Validazione base58 per chiave pubblica Solana
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(publicKey) || publicKey.length < 32 || publicKey.length > 44) {
      setError('Indirizzo wallet non valido per airdrop');
      return;
    }

    try {
      setAirdropLoading(true);
      setError(null);
      console.log(`Richiesta airdrop per: ${publicKey}`);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/phantom/airdrop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicKey })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Airdrop completato:', data.signature);
        // Aggiorna il saldo dopo l'airdrop
        setTimeout(() => getBalance(), 2000);
      } else {
        setError('Airdrop fallito: ' + data.error);
      }
    } catch (err) {
      setError('Errore durante l\'airdrop: ' + err.message);
    } finally {
      setAirdropLoading(false);
    }
  };

  // Salva configurazione
  const saveConfiguration = async () => {
    if (!publicKey) return;

    const config = {
      mode: 'phantom_integration',
      wallet: {
        publicKey,
        network,
        note: 'Configurazione Phantom - Solo indirizzo pubblico salvato'
      },
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/phantom/save-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Download del file di configurazione
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'phantom-wallet-config.json';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setError('Errore nel salvataggio: ' + data.error);
      }
    } catch (err) {
      setError('Errore durante il salvataggio: ' + err.message);
    }
  };

  // Cambia network
  const handleNetworkChange = (event) => {
    setNetwork(event.target.value);
    if (publicKey) {
      getBalance();
    }
  };

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <AccountBalanceWallet sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h2">
            🦄 Phantom Wallet Integration
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stato connessione */}
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="body2" sx={{ mr: 1 }}>Stato:</Typography>
          {connected ? (
            <Chip 
              icon={<CheckCircle />} 
              label="Connesso" 
              color="success" 
              size="small" 
            />
          ) : (
            <Chip 
              icon={<ErrorIcon />} 
              label="Disconnesso" 
              color="error" 
              size="small" 
            />
          )}
        </Box>

        {/* Selezione Network */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Network</InputLabel>
          <Select
            value={network}
            label="Network"
            onChange={handleNetworkChange}
          >
            <MenuItem value="devnet">Devnet (Test)</MenuItem>
            <MenuItem value="mainnet">Mainnet (Produzione)</MenuItem>
          </Select>
        </FormControl>

        {/* Pulsanti di connessione */}
        <Box display="flex" gap={2} mb={2}>
          {!connected ? (
            <Button
              variant="contained"
              onClick={connectPhantom}
              disabled={loading || !phantom}
              startIcon={loading ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
              fullWidth
            >
              {loading ? 'Connessione...' : 'Connetti Phantom'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={disconnectPhantom}
              color="error"
              fullWidth
            >
              Disconnetti
            </Button>
          )}
        </Box>

        {/* Informazioni wallet */}
        {connected && publicKey && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Indirizzo Wallet:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                wordBreak: 'break-all', 
                bgcolor: 'background.paper', 
                p: 1, 
                borderRadius: 1,
                mb: 2
              }}
            >
              {publicKey}
            </Typography>

            {/* Saldo */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2">
                Saldo: {balance !== null ? `${balance} SOL` : 'Caricamento...'}
              </Typography>
              <Tooltip title="Aggiorna saldo">
                <IconButton 
                  onClick={() => getBalance()} 
                  disabled={loading}
                  size="small"
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Airdrop (solo devnet) */}
            {network === 'devnet' && (
              <Button
                variant="outlined"
                onClick={requestAirdrop}
                disabled={airdropLoading}
                startIcon={airdropLoading ? <CircularProgress size={20} /> : null}
                sx={{ mb: 2 }}
                fullWidth
              >
                {airdropLoading ? 'Richiedendo...' : '💧 Richiedi Airdrop (1 SOL)'}
              </Button>
            )}

            {/* Salva configurazione */}
            <Button
              variant="contained"
              onClick={saveConfiguration}
              startIcon={<Download />}
              fullWidth
              color="secondary"
            >
              💾 Salva Configurazione
            </Button>
          </>
        )}

        {/* Avviso se Phantom non è installato */}
        {!phantom && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Box display="flex" alignItems="center">
              <Warning sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  Phantom Wallet non rilevato
                </Typography>
                <Typography variant="body2">
                  Installa l'estensione da{' '}
                  <a 
                    href="https://phantom.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'inherit' }}
                  >
                    phantom.app
                  </a>
                </Typography>
              </Box>
            </Box>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PhantomWallet;