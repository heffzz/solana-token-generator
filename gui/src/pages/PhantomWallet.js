import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  Divider
} from '@mui/material';
import {
  Security,
  AccountBalanceWallet,
  CloudDownload,
  NetworkCheck,
  MonetizationOn,
  Save,
  CheckCircle,
  Refresh
} from '@mui/icons-material';
import PhantomWalletComponent from '../components/PhantomWallet';
import { useSystem } from '../context/SystemContext';

const PhantomWalletPage = () => {
  const { phantomWallet, phantomBalance, requestAirdrop, loadPhantomData } = useSystem();

  const handleAirdrop = async () => {
    await requestAirdrop();
  };

  const handleRefresh = () => {
    loadPhantomData();
  };
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          🦄 Phantom Wallet Integration
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Connetti il tuo Phantom Wallet in modo sicuro senza mai condividere seed phrase o chiavi private
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Stato Wallet Configurato */}
        {phantomWallet && (
          <Grid item xs={12}>
            <Card sx={{ mb: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <CheckCircle />
                    <Box>
                      <Typography variant="h6">
                        Wallet Phantom Configurato
                      </Typography>
                      <Typography variant="body2">
                        Indirizzo: {phantomWallet.publicKey}
                      </Typography>
                      <Box display="flex" gap={1} mt={1}>
                        <Chip 
                          label={phantomWallet.network || 'mainnet'} 
                          size="small" 
                          color="primary"
                        />
                        {phantomBalance !== null && (
                          <Chip 
                            label={`${phantomBalance} SOL`} 
                            size="small" 
                            color="secondary"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<Refresh />}
                      onClick={handleRefresh}
                      sx={{ color: 'inherit', borderColor: 'currentColor' }}
                    >
                      Aggiorna
                    </Button>
                    {phantomWallet.network === 'devnet' && (
                      <Button 
                        variant="contained" 
                        size="small" 
                        startIcon={<MonetizationOn />}
                        onClick={handleAirdrop}
                        sx={{ bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
                      >
                        Airdrop
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Componente principale Phantom */}
        <Grid item xs={12} md={8}>
          <PhantomWalletComponent />
        </Grid>

        {/* Pannello informazioni */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔐 Caratteristiche di Sicurezza
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Security color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Nessuna seed phrase richiesta"
                    secondary="Mai condivisa o salvata"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <AccountBalanceWallet color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Connessione browser diretta"
                    secondary="Phantom mantiene il controllo"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Save color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Solo indirizzi pubblici"
                    secondary="Zero dati sensibili salvati"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <NetworkCheck color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Supporto Devnet/Mainnet"
                    secondary="Test sicuri e produzione"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <MonetizationOn color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Airdrop automatici"
                    secondary="SOL gratuiti su Devnet"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CloudDownload color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Export configurazione"
                    secondary="Integrazione con il progetto"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Guida rapida */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚀 Guida Rapida
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>1. Connetti Phantom:</strong> Clicca "Connetti Phantom" e approva la connessione
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>2. Seleziona Network:</strong> Scegli Devnet per test o Mainnet per produzione
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>3. Monitora Saldo:</strong> Visualizza il saldo in tempo reale
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>4. Airdrop (Devnet):</strong> Richiedi SOL gratuiti per test
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>5. Salva Config:</strong> Esporta la configurazione per integrarla nel progetto
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Avvisi importanti */}
      <Box mt={4}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>💡 Suggerimento:</strong> Usa sempre Devnet per test e sviluppo. 
            Passa a Mainnet solo quando sei pronto per la produzione.
          </Typography>
        </Alert>
        
        <Alert severity="success">
          <Typography variant="body2">
            <strong>✅ Sicurezza Garantita:</strong> Questa integrazione non richiede mai seed phrase 
            o chiavi private. Phantom mantiene sempre il controllo completo del tuo wallet.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default PhantomWalletPage;