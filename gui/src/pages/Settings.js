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
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  FormGroup,
  RadioGroup,
  Radio,
  FormLabel,
  Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Wifi as NetworkIcon,
  Speed as PerformanceIcon,
  Backup as BackupIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Computer as SystemIcon,
  Token as TokenIcon,
  AccountBalance as DaoIcon
} from '@mui/icons-material';
import { useSystem } from '../context/SystemContext';

const Settings = () => {
  const { systemStatus, updateConfig } = useSystem();
  
  const [settings, setSettings] = useState({
    // General Settings
    theme: 'dark',
    language: 'it',
    autoRefresh: true,
    refreshInterval: 30,
    notifications: true,
    soundEnabled: false,
    
    // Token Generator Settings
    tokenGenerator: {
      enabled: true,
      autoGenerate: false,
      maxTokensPerDay: 10,
      minSupply: 1000000,
      maxSupply: 1000000000,
      defaultDecimals: 9,
      enableUniqueCheck: true,
      enableAIDescription: true,
      autoListOnDEX: false,
      retryAttempts: 3,
      retryDelay: 5000
    },
    
    // DAO Settings
    dao: {
      enabled: true,
      votingPeriod: 7,
      quorumPercentage: 51,
      proposalThreshold: 1000,
      enableAutoExecution: false,
      maxProposalsPerUser: 5,
      cooldownPeriod: 24
    },
    
    // DEX Settings
    dex: {
      enableRaydium: true,
      enableOrca: true,
      enableSerum: false,
      defaultSlippage: 1,
      maxSlippage: 5,
      autoAddLiquidity: false,
      liquidityAmount: 1000,
      priceImpactThreshold: 2
    },
    
    // Network Settings
    network: {
      rpcEndpoint: 'https://api.mainnet-beta.solana.com',
      commitment: 'confirmed',
      timeout: 30000,
      retryAttempts: 3,
      enableBackup: true,
      backupEndpoints: [
        'https://solana-api.projectserum.com',
        'https://api.mainnet-beta.solana.com'
      ]
    },
    
    // Security Settings
    security: {
      enableEncryption: true,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      enableTwoFactor: false,
      logLevel: 'info',
      enableAuditLog: true,
      autoBackup: true,
      backupInterval: 24
    },
    
    // Performance Settings
    performance: {
      maxConcurrentOperations: 5,
      cacheEnabled: true,
      cacheSize: 100,
      enableCompression: true,
      optimizeImages: true,
      lazyLoading: true,
      enablePrefetch: false
    }
  });
  
  const [expandedPanel, setExpandedPanel] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', action: null });
  const [backupDialog, setBackupDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('lunacoin-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const handleDirectSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setUnsavedChanges(true);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('lunacoin-settings', JSON.stringify(settings));
      updateConfig(settings);
      setUnsavedChanges(false);
      setSnackbar({ open: true, message: 'Impostazioni salvate con successo!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Errore nel salvare le impostazioni', severity: 'error' });
    }
  };

  const resetSettings = () => {
    setConfirmDialog({
      open: true,
      title: 'Reset Impostazioni',
      message: 'Sei sicuro di voler ripristinare tutte le impostazioni ai valori predefiniti?',
      action: () => {
        // Reset to default values
        setSettings({
          theme: 'dark',
          language: 'it',
          autoRefresh: true,
          refreshInterval: 30,
          notifications: true,
          soundEnabled: false,
          tokenGenerator: {
            enabled: true,
            autoGenerate: false,
            maxTokensPerDay: 10,
            minSupply: 1000000,
            maxSupply: 1000000000,
            defaultDecimals: 9,
            enableUniqueCheck: true,
            enableAIDescription: true,
            autoListOnDEX: false,
            retryAttempts: 3,
            retryDelay: 5000
          },
          dao: {
            enabled: true,
            votingPeriod: 7,
            quorumPercentage: 51,
            proposalThreshold: 1000,
            enableAutoExecution: false,
            maxProposalsPerUser: 5,
            cooldownPeriod: 24
          },
          dex: {
            enableRaydium: true,
            enableOrca: true,
            enableSerum: false,
            defaultSlippage: 1,
            maxSlippage: 5,
            autoAddLiquidity: false,
            liquidityAmount: 1000,
            priceImpactThreshold: 2
          },
          network: {
            rpcEndpoint: 'https://api.mainnet-beta.solana.com',
            commitment: 'confirmed',
            timeout: 30000,
            retryAttempts: 3,
            enableBackup: true,
            backupEndpoints: [
              'https://solana-api.projectserum.com',
              'https://api.mainnet-beta.solana.com'
            ]
          },
          security: {
            enableEncryption: true,
            sessionTimeout: 60,
            maxLoginAttempts: 5,
            enableTwoFactor: false,
            logLevel: 'info',
            enableAuditLog: true,
            autoBackup: true,
            backupInterval: 24
          },
          performance: {
            maxConcurrentOperations: 5,
            cacheEnabled: true,
            cacheSize: 100,
            enableCompression: true,
            optimizeImages: true,
            lazyLoading: true,
            enablePrefetch: false
          }
        });
        setUnsavedChanges(true);
        setSnackbar({ open: true, message: 'Impostazioni ripristinate ai valori predefiniti', severity: 'info' });
      }
    });
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lunacoin-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          setUnsavedChanges(true);
          setSnackbar({ open: true, message: 'Impostazioni importate con successo!', severity: 'success' });
        } catch (error) {
          setSnackbar({ open: true, message: 'Errore nell\'importazione delle impostazioni', severity: 'error' });
        }
      };
      reader.readAsText(file);
    }
  };

  const renderGeneralSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Tema</InputLabel>
          <Select
            value={settings.theme}
            onChange={(e) => handleDirectSettingChange('theme', e.target.value)}
          >
            <MenuItem value="dark">Scuro</MenuItem>
            <MenuItem value="light">Chiaro</MenuItem>
            <MenuItem value="auto">Automatico</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Lingua</InputLabel>
          <Select
            value={settings.language}
            onChange={(e) => handleDirectSettingChange('language', e.target.value)}
          >
            <MenuItem value="it">Italiano</MenuItem>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Español</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoRefresh}
              onChange={(e) => handleDirectSettingChange('autoRefresh', e.target.checked)}
            />
          }
          label="Aggiornamento Automatico"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography gutterBottom>Intervallo Aggiornamento (secondi)</Typography>
        <Slider
          value={settings.refreshInterval}
          onChange={(e, value) => handleDirectSettingChange('refreshInterval', value)}
          min={5}
          max={300}
          step={5}
          marks
          valueLabelDisplay="auto"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.notifications}
              onChange={(e) => handleDirectSettingChange('notifications', e.target.checked)}
            />
          }
          label="Notifiche"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.soundEnabled}
              onChange={(e) => handleDirectSettingChange('soundEnabled', e.target.checked)}
            />
          }
          label="Suoni"
        />
      </Grid>
    </Grid>
  );

  const renderTokenGeneratorSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.tokenGenerator.enabled}
              onChange={(e) => handleSettingChange('tokenGenerator', 'enabled', e.target.checked)}
            />
          }
          label="Abilita Token Generator"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Max Token per Giorno"
          type="number"
          value={settings.tokenGenerator.maxTokensPerDay}
          onChange={(e) => handleSettingChange('tokenGenerator', 'maxTokensPerDay', parseInt(e.target.value))}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Decimali Predefiniti"
          type="number"
          value={settings.tokenGenerator.defaultDecimals}
          onChange={(e) => handleSettingChange('tokenGenerator', 'defaultDecimals', parseInt(e.target.value))}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Supply Minimo"
          type="number"
          value={settings.tokenGenerator.minSupply}
          onChange={(e) => handleSettingChange('tokenGenerator', 'minSupply', parseInt(e.target.value))}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Supply Massimo"
          type="number"
          value={settings.tokenGenerator.maxSupply}
          onChange={(e) => handleSettingChange('tokenGenerator', 'maxSupply', parseInt(e.target.value))}
        />
      </Grid>
      <Grid item xs={12}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.tokenGenerator.enableUniqueCheck}
                onChange={(e) => handleSettingChange('tokenGenerator', 'enableUniqueCheck', e.target.checked)}
              />
            }
            label="Controllo Unicità"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.tokenGenerator.enableAIDescription}
                onChange={(e) => handleSettingChange('tokenGenerator', 'enableAIDescription', e.target.checked)}
              />
            }
            label="Descrizione AI"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.tokenGenerator.autoListOnDEX}
                onChange={(e) => handleSettingChange('tokenGenerator', 'autoListOnDEX', e.target.checked)}
              />
            }
            label="Auto Listing su DEX"
          />
        </FormGroup>
      </Grid>
    </Grid>
  );

  const renderDAOSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.dao.enabled}
              onChange={(e) => handleSettingChange('dao', 'enabled', e.target.checked)}
            />
          }
          label="Abilita DAO"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Periodo di Voto (giorni)"
          type="number"
          value={settings.dao.votingPeriod}
          onChange={(e) => handleSettingChange('dao', 'votingPeriod', parseInt(e.target.value))}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Quorum (%)"
          type="number"
          value={settings.dao.quorumPercentage}
          onChange={(e) => handleSettingChange('dao', 'quorumPercentage', parseInt(e.target.value))}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Soglia Proposta"
          type="number"
          value={settings.dao.proposalThreshold}
          onChange={(e) => handleSettingChange('dao', 'proposalThreshold', parseInt(e.target.value))}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Max Proposte per Utente"
          type="number"
          value={settings.dao.maxProposalsPerUser}
          onChange={(e) => handleSettingChange('dao', 'maxProposalsPerUser', parseInt(e.target.value))}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.dao.enableAutoExecution}
              onChange={(e) => handleSettingChange('dao', 'enableAutoExecution', e.target.checked)}
            />
          }
          label="Esecuzione Automatica"
        />
      </Grid>
    </Grid>
  );

  const renderNetworkSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="RPC Endpoint"
          value={settings.network.rpcEndpoint}
          onChange={(e) => handleSettingChange('network', 'rpcEndpoint', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Commitment</InputLabel>
          <Select
            value={settings.network.commitment}
            onChange={(e) => handleSettingChange('network', 'commitment', e.target.value)}
          >
            <MenuItem value="processed">Processed</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="finalized">Finalized</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Timeout (ms)"
          type="number"
          value={settings.network.timeout}
          onChange={(e) => handleSettingChange('network', 'timeout', parseInt(e.target.value))}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.network.enableBackup}
              onChange={(e) => handleSettingChange('network', 'enableBackup', e.target.checked)}
            />
          }
          label="Endpoint di Backup"
        />
      </Grid>
    </Grid>
  );

  const renderSecuritySettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Timeout Sessione (minuti)"
          type="number"
          value={settings.security.sessionTimeout}
          onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Livello Log</InputLabel>
          <Select
            value={settings.security.logLevel}
            onChange={(e) => handleSettingChange('security', 'logLevel', e.target.value)}
          >
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="debug">Debug</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.security.enableEncryption}
                onChange={(e) => handleSettingChange('security', 'enableEncryption', e.target.checked)}
              />
            }
            label="Crittografia"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.security.enableAuditLog}
                onChange={(e) => handleSettingChange('security', 'enableAuditLog', e.target.checked)}
              />
            }
            label="Log di Audit"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.security.autoBackup}
                onChange={(e) => handleSettingChange('security', 'autoBackup', e.target.checked)}
              />
            }
            label="Backup Automatico"
          />
        </FormGroup>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" className="gradient-text">
          Impostazioni
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {unsavedChanges && (
            <Chip 
              label="Modifiche non salvate" 
              color="warning" 
              size="small"
              icon={<WarningIcon />}
            />
          )}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportSettings}
            size="small"
          >
            Esporta
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            component="label"
            size="small"
          >
            Importa
            <input
              type="file"
              hidden
              accept=".json"
              onChange={importSettings}
            />
          </Button>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={resetSettings}
            size="small"
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveSettings}
            disabled={!unsavedChanges}
          >
            Salva
          </Button>
        </Box>
      </Box>

      {/* Settings Panels */}
      <Box>
        <Accordion 
          expanded={expandedPanel === 'general'} 
          onChange={() => setExpandedPanel(expandedPanel === 'general' ? '' : 'general')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon />
              <Typography variant="h6">Impostazioni Generali</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderGeneralSettings()}
          </AccordionDetails>
        </Accordion>

        <Accordion 
          expanded={expandedPanel === 'tokenGenerator'} 
          onChange={() => setExpandedPanel(expandedPanel === 'tokenGenerator' ? '' : 'tokenGenerator')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TokenIcon />
              <Typography variant="h6">Token Generator</Typography>
              <Chip 
                label={settings.tokenGenerator.enabled ? 'Attivo' : 'Disattivo'} 
                color={settings.tokenGenerator.enabled ? 'success' : 'default'} 
                size="small"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderTokenGeneratorSettings()}
          </AccordionDetails>
        </Accordion>

        <Accordion 
          expanded={expandedPanel === 'dao'} 
          onChange={() => setExpandedPanel(expandedPanel === 'dao' ? '' : 'dao')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DaoIcon />
              <Typography variant="h6">DAO Governance</Typography>
              <Chip 
                label={settings.dao.enabled ? 'Attivo' : 'Disattivo'} 
                color={settings.dao.enabled ? 'success' : 'default'} 
                size="small"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderDAOSettings()}
          </AccordionDetails>
        </Accordion>

        <Accordion 
          expanded={expandedPanel === 'network'} 
          onChange={() => setExpandedPanel(expandedPanel === 'network' ? '' : 'network')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NetworkIcon />
              <Typography variant="h6">Rete</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderNetworkSettings()}
          </AccordionDetails>
        </Accordion>

        <Accordion 
          expanded={expandedPanel === 'security'} 
          onChange={() => setExpandedPanel(expandedPanel === 'security' ? '' : 'security')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon />
              <Typography variant="h6">Sicurezza</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderSecuritySettings()}
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Annulla</Button>
          <Button 
            onClick={() => {
              confirmDialog.action();
              setConfirmDialog({ ...confirmDialog, open: false });
            }}
            color="primary"
          >
            Conferma
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;