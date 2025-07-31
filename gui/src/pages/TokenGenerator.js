import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Token as TokenIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useSystem } from '../context/SystemContext';
import { realDataService } from '../services/api';

const TokenGenerator = () => {
  const { 
    systemStatus, 
    stats, 
    logs,
    startTokenGenerator,
    stopTokenGenerator,
    config,
    updateConfig,
    addLog,
    realStats,
    realReports
  } = useSystem();

  const [tokens, setTokens] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [newToken, setNewToken] = useState({
    name: '',
    symbol: '',
    description: '',
    supply: 1000000,
    decimals: 9,
    category: 'utility',
    autoGenerate: true
  });
  const [generatorSettings, setGeneratorSettings] = useState({
    autoMode: true,
    generationInterval: 300,
    maxTokensPerHour: 10,
    enableUniqueCheck: true,
    enableDEXListing: true,
    minSupply: 100000,
    maxSupply: 10000000
  });

  const categories = [
    { value: 'defi', label: 'DeFi' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'nft', label: 'NFT' },
    { value: 'utility', label: 'Utility' },
    { value: 'meme', label: 'Meme' },
    { value: 'governance', label: 'Governance' }
  ];

  useEffect(() => {
    // Carica token reali se disponibili
    if (realStats?.tokenGenerator?.tokens) {
      setTokens(realStats.tokens || []);
    } else {
      // Fallback ai token mock
      const mockTokens = [
        {
          id: 1,
          name: 'SolarFlare Protocol',
          symbol: 'SFIRE',
          address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv',
          supply: 10000000,
          status: 'deployed',
          category: 'defi',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          dexListed: true
        },
        {
          id: 2,
          name: 'MoonBeam Finance',
          symbol: 'MBEAM',
          address: 'BQWWFhzBdw2vKKBUX17NHeFbCoFQHfRARpdztPE2tDJ',
          supply: 25000000,
          status: 'deployed',
          category: 'defi',
          createdAt: new Date(Date.now() - 2520000).toISOString(),
          dexListed: true
        },
        {
          id: 3,
          name: 'CryptoWave Network',
          symbol: 'CWAVE',
          address: 'DfXnSjDdLAUX5vLCzb4uB8UX17NHeFbCoFQHfRARpdzs',
          supply: 50000000,
          status: 'pending',
          category: 'infrastructure',
          createdAt: new Date(Date.now() - 680000).toISOString(),
          dexListed: false
        },
        {
          id: 4,
          name: 'StellarX Protocol',
          symbol: 'STRX',
          address: 'GhJsh4SLi3akxmAfh3XKnWsMbHM6zGEWQtPc6BdwvKK',
          supply: 100000000,
          status: 'deployed',
          category: 'utility',
          createdAt: new Date(Date.now() - 1260000).toISOString(),
          dexListed: true
        },
        {
          id: 5,
          name: 'QuantumCoin',
          symbol: 'QCOIN',
          address: 'Pc6GhJsh4SLi3akxmAfh3XKnWsMbHM6zGEWQtBdwvKKB',
          supply: 21000000,
          status: 'deployed',
          category: 'store-of-value',
          createdAt: new Date(Date.now() - 1840000).toISOString(),
          dexListed: true
        }
      ];
      setTokens(mockTokens);
    }
  }, [realStats]);

  const handleCreateToken = async () => {
    if (!newToken.name || !newToken.symbol) {
      alert('Nome e simbolo sono obbligatori');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Avvia la generazione di token reali tramite API
      const response = await realDataService.startTokenGeneration(1);
      
      const token = {
        id: Date.now(),
        ...newToken,
        address: 'Generating...',
        status: 'creating',
        createdAt: new Date().toISOString(),
        dexListed: false
      };

      setTokens(prev => [token, ...prev]);
      setOpenDialog(false);
      setNewToken({
        name: '',
        symbol: '',
        description: '',
        supply: 1000000,
        decimals: 9,
        category: 'utility',
        autoGenerate: true
      });
      
      alert(`Generazione token avviata: ${response.message}`);
      
    } catch (error) {
      console.error('Errore nella generazione token:', error);
      alert(`Errore: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateRandom = () => {
    const names = ['CryptoMoon', 'DefiStar', 'GameCoin', 'NFTToken', 'MetaVerse', 'BlockChain'];
    const symbols = ['MOON', 'STAR', 'GAME', 'NFT', 'META', 'BLOCK'];
    const categories = ['defi', 'gaming', 'nft', 'utility', 'meme'];
    
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    setNewToken({
      ...newToken,
      name: randomName,
      symbol: randomSymbol,
      category: randomCategory,
      supply: Math.floor(Math.random() * 9000000) + 1000000
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'deployed': return <SuccessIcon sx={{ color: '#4caf50' }} />;
      case 'creating': return <InfoIcon sx={{ color: '#2196f3' }} />;
      case 'pending': return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'error': return <ErrorIcon sx={{ color: '#f44336' }} />;
      default: return <InfoIcon sx={{ color: '#2196f3' }} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'deployed': return 'Distribuito';
      case 'creating': return 'Creazione...';
      case 'pending': return 'In Attesa';
      case 'error': return 'Errore';
      default: return 'Sconosciuto';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Qui potresti aggiungere una notifica
  };

  const getTokenLogs = () => {
    if (!logs || !Array.isArray(logs.tokenGenerator)) {
      return [];
    }
    return logs.tokenGenerator.slice(0, 10);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" className="gradient-text">
          Token Generator
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setOpenSettingsDialog(true)}
            sx={{ mr: 1 }}
          >
            Impostazioni
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            disabled={!systemStatus.tokenGenerator}
          >
            Nuovo Token
          </Button>
        </Box>
      </Box>

      {/* Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {systemStatus.tokenGenerator ? (
                  <SuccessIcon sx={{ color: '#4caf50', mr: 1 }} />
                ) : (
                  <ErrorIcon sx={{ color: '#f44336', mr: 1 }} />
                )}
                <Typography variant="h6">
                  {systemStatus.tokenGenerator ? 'Sistema Attivo' : 'Sistema Inattivo'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Token Generati: {realStats?.tokenGenerator?.tokensCreated || stats.tokensGenerated || 0} | Errori: {realStats?.tokenGenerator?.errors || stats.errors || 0}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={systemStatus.tokenGenerator ? 75 : 0} 
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant={systemStatus.tokenGenerator ? 'outlined' : 'contained'}
                color={systemStatus.tokenGenerator ? 'error' : 'success'}
                startIcon={systemStatus.tokenGenerator ? <StopIcon /> : <PlayIcon />}
                onClick={systemStatus.tokenGenerator ? stopTokenGenerator : startTokenGenerator}
                fullWidth
              >
                {systemStatus.tokenGenerator ? 'Ferma' : 'Avvia'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tokens List */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Token Creati ({tokens.length})
                </Typography>
                <IconButton onClick={() => window.location.reload()}>
                  <RefreshIcon />
                </IconButton>
              </Box>
              <List>
                {tokens.map((token, index) => (
                  <React.Fragment key={token.id}>
                    <ListItem>
                      <ListItemIcon>
                        <TokenIcon sx={{ color: '#667eea' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">{token.name}</Typography>
                            <Chip label={token.symbol} size="small" variant="outlined" />
                            <Chip 
                              label={token.category} 
                              size="small" 
                              color="primary" 
                              variant="filled"
                            />
                          </Box>
                        }
                        secondary={
                          <Box component="span">
                            <span style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                              Supply: {token.supply.toLocaleString()} | 
                              Creato: {new Date(token.createdAt).toLocaleDateString()}
                            </span>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <span style={{ fontSize: '0.875rem', marginRight: '8px' }}>
                                {token.address.length > 20 ? 
                                  `${token.address.substring(0, 20)}...` : 
                                  token.address
                                }
                              </span>
                              {token.address !== 'Generating...' && (
                                <IconButton 
                                  size="small" 
                                  onClick={() => copyToClipboard(token.address)}
                                >
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(token.status)}
                          <Typography variant="body2">
                            {getStatusText(token.status)}
                          </Typography>
                          {token.dexListed && (
                            <Chip label="DEX" size="small" color="success" />
                          )}
                          <IconButton size="small">
                            <LaunchIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < tokens.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {tokens.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="Nessun token creato"
                      secondary="Clicca su 'Nuovo Token' per iniziare"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiche
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {tokens.filter(t => t.status === 'deployed').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Distribuiti
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {tokens.filter(t => t.status === 'creating' || t.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Processo
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {tokens.filter(t => t.dexListed).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Su DEX
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {tokens.filter(t => t.status === 'error').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Errori
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Log Recenti
              </Typography>
              <List dense>
                {getTokenLogs().map((log, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      {getStatusIcon(log.level)}
                    </ListItemIcon>

                    <ListItemText
                      primary={log.message ? (log.message.substring(0, 40) + '...') : 'Messaggio non disponibile'}
                      secondary={new Date(log.timestamp).toLocaleTimeString()}
                    />
                  </ListItem>
                ))}
                {getTokenLogs().length === 0 && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="Nessun log disponibile"
                      secondary="I log appariranno qui"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Token Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crea Nuovo Token</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome Token"
                value={newToken.name}
                onChange={(e) => setNewToken({...newToken, name: e.target.value})}
                placeholder="es. LunaCoin"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Simbolo"
                value={newToken.symbol}
                onChange={(e) => setNewToken({...newToken, symbol: e.target.value.toUpperCase()})}
                placeholder="es. LUNA"
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrizione"
                value={newToken.description}
                onChange={(e) => setNewToken({...newToken, description: e.target.value})}
                placeholder="Descrizione del token..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={newToken.category}
                  onChange={(e) => setNewToken({...newToken, category: e.target.value})}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Supply Totale"
                value={newToken.supply}
                onChange={(e) => setNewToken({...newToken, supply: parseInt(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Decimali: {newToken.decimals}</Typography>
              <Slider
                value={newToken.decimals}
                onChange={(e, value) => setNewToken({...newToken, decimals: value})}
                min={0}
                max={18}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newToken.autoGenerate}
                    onChange={(e) => setNewToken({...newToken, autoGenerate: e.target.checked})}
                  />
                }
                label="Genera automaticamente descrizione e metadati"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button onClick={handleGenerateRandom} variant="outlined">
            Genera Casuale
          </Button>
          <Button onClick={handleCreateToken} variant="contained">
            Crea Token
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={openSettingsDialog} onClose={() => setOpenSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Impostazioni Generator</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={generatorSettings.autoMode}
                  onChange={(e) => setGeneratorSettings({...generatorSettings, autoMode: e.target.checked})}
                />
              }
              label="Modalità Automatica"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Genera token automaticamente secondo gli intervalli impostati
            </Typography>

            <TextField
              fullWidth
              type="number"
              label="Intervallo Generazione (secondi)"
              value={generatorSettings.generationInterval}
              onChange={(e) => setGeneratorSettings({...generatorSettings, generationInterval: parseInt(e.target.value)})}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="number"
              label="Max Token per Ora"
              value={generatorSettings.maxTokensPerHour}
              onChange={(e) => setGeneratorSettings({...generatorSettings, maxTokensPerHour: parseInt(e.target.value)})}
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={generatorSettings.enableUniqueCheck}
                  onChange={(e) => setGeneratorSettings({...generatorSettings, enableUniqueCheck: e.target.checked})}
                />
              }
              label="Controllo Unicità"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Verifica che nome e simbolo siano unici
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={generatorSettings.enableDEXListing}
                  onChange={(e) => setGeneratorSettings({...generatorSettings, enableDEXListing: e.target.checked})}
                />
              }
              label="Listing Automatico su DEX"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettingsDialog(false)}>Annulla</Button>
          <Button onClick={() => setOpenSettingsDialog(false)} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TokenGenerator;