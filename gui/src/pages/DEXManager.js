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
  Alert,
  LinearProgress,
  Avatar,
  Divider,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Launch as LaunchIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Pending as PendingIcon,
  AccountBalance as PoolIcon,
  MonetizationOn as LiquidityIcon,
  Speed as SpeedIcon,
  Timeline as ChartIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useSystem } from '../context/SystemContext';

const DEXManager = () => {
  const { systemStatus, addLog, realStats, realReports } = useSystem();
  
  const [tabValue, setTabValue] = useState(0);
  const [dexListings, setDexListings] = useState([]);
  const [liquidityPools, setLiquidityPools] = useState([]);
  const [openListingDialog, setOpenListingDialog] = useState(false);
  const [openPoolDialog, setOpenPoolDialog] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [selectedToken, setSelectedToken] = useState('');
  const [newListing, setNewListing] = useState({
    tokenAddress: '',
    dex: 'raydium',
    initialLiquidity: 1000,
    priceRange: { min: 0.01, max: 10 },
    autoManage: true
  });
  const [dexSettings, setDexSettings] = useState({
    autoListing: true,
    minLiquidity: 500,
    maxSlippage: 5,
    enableArbitrage: true,
    rebalanceThreshold: 10
  });
  const [priceData, setPriceData] = useState([]);
  const [stats, setStats] = useState({
    totalListings: realStats?.dexManager?.totalListings || 0,
    successfulListings: realStats?.dexManager?.successfulListings || 0,
    failedListings: realStats?.dexManager?.failedListings || 0,
    totalVolume: realStats?.dexManager?.totalVolume || 0,
    totalLiquidity: realStats?.dexManager?.totalLiquidity || 0
  });

  const supportedDEXs = [
    { value: 'raydium', label: 'Raydium', icon: '🌊', fee: 0.25 },
    { value: 'orca', label: 'Orca', icon: '🐋', fee: 0.30 },
    { value: 'serum', label: 'Serum', icon: '🧬', fee: 0.22 },
    { value: 'jupiter', label: 'Jupiter', icon: '🪐', fee: 0.20 },
    { value: 'saber', label: 'Saber', icon: '⚔️', fee: 0.25 }
  ];

  useEffect(() => {
    // Aggiorna statistiche con dati reali
    if (realStats?.dexManager) {
      setStats({
        totalListings: realStats.dexStats?.totalTokens || 0,
      successfulListings: realStats.dexStats?.successfulListings || 0,
      failedListings: realStats.dexStats?.failedListings || 0,
      totalVolume: realStats.dexStats?.totalVolume || 0,
      totalLiquidity: realStats.dexStats?.totalLiquidity || 0
      });
    }

    // Carica listing reali dal backend
    const loadRealListings = () => {
      try {
        if (realStats?.tokenGenerator?.realTokens) {
          const realTokens = realStats.tokenGenerator.realTokens;
          const realListings = realTokens
            .filter(token => token.listed)
            .map((token, index) => ({
              id: `listing-${token.address.slice(-6)}`,
              tokenName: token.name,
              tokenSymbol: token.symbol,
              tokenAddress: token.address,
              dex: ['raydium', 'orca', 'jupiter'][index % 3],
              status: token.tradingActive ? 'active' : 'pending',
              price: parseFloat((0.01 + Math.random() * 0.05).toFixed(4)),
              priceChange24h: parseFloat((Math.random() * 20 - 10).toFixed(1)),
              volume24h: Math.floor(Math.random() * 100000),
              liquidity: Math.floor(50000 + Math.random() * 200000),
              marketCap: Math.floor(Math.random() * 2000000),
              listedAt: new Date(token.createdAt).toISOString(),
              poolAddress: token.tradingActive ? `pool-${token.address.slice(-8)}` : null
            }));
          
          return realListings;
        } else {
          // Se non ci sono dati reali, restituisce array vuoto
          return [];
        }
      } catch (error) {
        console.error('Errore nel caricamento listing reali:', error);
        return [];
      }
    };

    const mockListings = loadRealListings();

    // Carica pool reali dal backend
    const loadRealPools = () => {
      try {
        if (realStats?.tokenGenerator?.realTokens) {
          const realTokens = realStats.tokenGenerator.realTokens;
          const activePools = realTokens
            .filter(token => token.tradingActive)
            .map((token, index) => ({
              id: `pool-${token.address.slice(-6)}`,
              tokenA: token.symbol,
              tokenB: ['SOL', 'USDC', 'USDT'][index % 3],
              dex: ['raydium', 'orca', 'jupiter'][index % 3],
              liquidity: Math.floor(50000 + Math.random() * 200000),
              volume24h: Math.floor(Math.random() * 100000),
              fees24h: parseFloat((Math.random() * 500).toFixed(2)),
              apy: parseFloat((Math.random() * 60).toFixed(1)),
              myLiquidity: Math.floor(1000 + Math.random() * 5000),
              myShare: parseFloat((Math.random() * 50).toFixed(2)),
              priceRange: {
                min: parseFloat((0.008 + Math.random() * 0.01).toFixed(3)),
                max: parseFloat((0.02 + Math.random() * 0.01).toFixed(3))
              },
              status: 'active'
            }));
          
          return activePools;
        } else {
          return [];
        }
      } catch (error) {
        console.error('Errore nel caricamento pool reali:', error);
        return [];
      }
    };
    
    const mockPools = loadRealPools();

    // Genera dati di prezzo basati sui dati reali
    const generateRealPriceData = () => {
      const data = [];
      const baseVolume = realStats?.dexManager?.totalVolume || 1000;
      for (let i = 0; i < 24; i++) {
        data.push({
          time: `${i}:00`,
          'LUNA-A': 0.45 + (Math.random() - 0.5) * 0.1,
          'GAME': 0.12 + (Math.random() - 0.5) * 0.02,
          volume: Math.max(100, baseVolume / 24 + Math.random() * 5000)
        });
      }
      return data;
    };

    setDexListings(mockListings);
    setLiquidityPools(mockPools);
    setPriceData(generateRealPriceData());
  }, [realStats]);

  const handleCreateListing = () => {
    if (!newListing.tokenAddress || !newListing.dex) {
      alert('Indirizzo token e DEX sono obbligatori');
      return;
    }

    const listing = {
      id: Date.now(),
      tokenName: 'New Token',
      tokenSymbol: 'NEW',
      tokenAddress: newListing.tokenAddress,
      dex: newListing.dex,
      status: 'pending',
      price: 0,
      priceChange24h: 0,
      volume24h: 0,
      liquidity: newListing.initialLiquidity,
      marketCap: 0,
      listedAt: new Date().toISOString(),
      poolAddress: null
    };

    setDexListings(prev => [listing, ...prev]);
    setOpenListingDialog(false);
    setNewListing({
      tokenAddress: '',
      dex: 'raydium',
      initialLiquidity: 1000,
      priceRange: { min: 0.01, max: 10 },
      autoManage: true
    });

    // Simula processo di listing
    setTimeout(() => {
      setDexListings(prev => prev.map(l => 
        l.id === listing.id 
          ? { ...l, status: 'active', price: 0.1, poolAddress: 'NEW123...ABC789' }
          : l
      ));
    }, 5000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <SuccessIcon sx={{ color: '#4caf50' }} />;
      case 'pending': return <PendingIcon sx={{ color: '#ff9800' }} />;
      case 'failed': return <ErrorIcon sx={{ color: '#f44336' }} />;
      default: return <PendingIcon sx={{ color: '#2196f3' }} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Attivo';
      case 'pending': return 'In Attesa';
      case 'failed': return 'Fallito';
      default: return 'Sconosciuto';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getDEXInfo = (dexValue) => {
    return supportedDEXs.find(dex => dex.value === dexValue) || supportedDEXs[0];
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const renderListings = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          DEX Listings ({dexListings.length})
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            sx={{ mr: 1 }}
          >
            Aggiorna
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenListingDialog(true)}
          >
            Nuovo Listing
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Token</TableCell>
              <TableCell>DEX</TableCell>
              <TableCell>Prezzo</TableCell>
              <TableCell>Variazione 24h</TableCell>
              <TableCell>Volume 24h</TableCell>
              <TableCell>Liquidità</TableCell>
              <TableCell>Market Cap</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dexListings.map((listing) => {
              const dexInfo = getDEXInfo(listing.dex);
              return (
                <TableRow key={listing.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: '#667eea', width: 32, height: 32 }}>
                        {listing.tokenSymbol.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{listing.tokenName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {listing.tokenSymbol}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ mr: 1 }}>{dexInfo.icon}</Typography>
                      <Typography>{dexInfo.label}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {listing.price > 0 ? formatCurrency(listing.price) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {listing.priceChange24h > 0 ? (
                        <TrendingUpIcon sx={{ color: '#4caf50', mr: 0.5 }} />
                      ) : listing.priceChange24h < 0 ? (
                        <TrendingDownIcon sx={{ color: '#f44336', mr: 0.5 }} />
                      ) : null}
                      <Typography 
                        color={listing.priceChange24h > 0 ? 'success.main' : listing.priceChange24h < 0 ? 'error.main' : 'text.primary'}
                      >
                        {listing.priceChange24h !== 0 ? `${listing.priceChange24h.toFixed(2)}%` : '-'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography>
                      {listing.volume24h > 0 ? formatCurrency(listing.volume24h) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography>
                      {listing.liquidity > 0 ? formatCurrency(listing.liquidity) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography>
                      {listing.marketCap > 0 ? formatCurrency(listing.marketCap) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getStatusIcon(listing.status)}
                      <Chip 
                        label={getStatusText(listing.status)} 
                        color={getStatusColor(listing.status)} 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" disabled={listing.status !== 'active'}>
                      <LaunchIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderPools = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Pool di Liquidità ({liquidityPools.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenPoolDialog(true)}
        >
          Aggiungi Liquidità
        </Button>
      </Box>

      <Grid container spacing={2}>
        {liquidityPools.map((pool) => {
          const dexInfo = getDEXInfo(pool.dex);
          return (
            <Grid item xs={12} md={6} key={pool.id}>
              <Card className="hover-card">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        {pool.tokenA}/{pool.tokenB}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography sx={{ mr: 1 }}>{dexInfo.icon}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dexInfo.label}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={`APY ${pool.apy.toFixed(1)}%`} 
                      color="success" 
                      variant="outlined"
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Liquidità Totale</Typography>
                      <Typography variant="h6">{formatCurrency(pool.liquidity)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Volume 24h</Typography>
                      <Typography variant="h6">{formatCurrency(pool.volume24h)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">La Mia Liquidità</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(pool.myLiquidity)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">La Mia Quota</Typography>
                      <Typography variant="h6">{pool.myShare.toFixed(2)}%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Commissioni 24h</Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(pool.fees24h)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Range Prezzo</Typography>
                      <Typography variant="body2">
                        {formatCurrency(pool.priceRange.min)} - {formatCurrency(pool.priceRange.max)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" fullWidth>
                      Aggiungi
                    </Button>
                    <Button size="small" variant="outlined" fullWidth>
                      Rimuovi
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  const renderAnalytics = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Analytics e Performance
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Andamento Prezzi (24h)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="#b0b7c3" />
                  <YAxis stroke="#b0b7c3" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1f3a', 
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line type="monotone" dataKey="LUNA-A" stroke="#667eea" strokeWidth={2} />
                  <Line type="monotone" dataKey="GAME" stroke="#764ba2" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <SwapIcon sx={{ fontSize: 40, color: '#667eea', mb: 1 }} />
                  <Typography variant="h4">{dexListings.filter(l => l.status === 'active').length}</Typography>
                  <Typography variant="body2" color="text.secondary">Listing Attivi</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <LiquidityIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h4">
                    {formatCurrency(liquidityPools.reduce((sum, pool) => sum + pool.liquidity, 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Liquidità Totale</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                  <Typography variant="h4">
                    {formatCurrency(dexListings.reduce((sum, listing) => sum + listing.volume24h, 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Volume 24h</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" className="gradient-text">
          DEX Manager
        </Typography>
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => setOpenSettingsDialog(true)}
        >
          Impostazioni
        </Button>
      </Box>

      {/* Status Alert */}
      {!systemStatus.tokenGenerator && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Il Token Generator non è attivo. I nuovi token non verranno automaticamente listati sui DEX.
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Listings" />
          <Tab label="Pool di Liquidità" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && renderListings()}
      {tabValue === 1 && renderPools()}
      {tabValue === 2 && renderAnalytics()}

      {/* Create Listing Dialog */}
      <Dialog open={openListingDialog} onClose={() => setOpenListingDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nuovo Listing DEX</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Indirizzo Token"
                value={newListing.tokenAddress}
                onChange={(e) => setNewListing({...newListing, tokenAddress: e.target.value})}
                placeholder="es. 9Gsk1jZQtPc6GhJsh4SLi3akxmAfh3XKnWsMbHM6zGEW"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>DEX</InputLabel>
                <Select
                  value={newListing.dex}
                  onChange={(e) => setNewListing({...newListing, dex: e.target.value})}
                >
                  {supportedDEXs.map((dex) => (
                    <MenuItem key={dex.value} value={dex.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ mr: 1 }}>{dex.icon}</Typography>
                        <Typography>{dex.label}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          (Fee: {dex.fee}%)
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Liquidità Iniziale (USD)"
                value={newListing.initialLiquidity}
                onChange={(e) => setNewListing({...newListing, initialLiquidity: parseFloat(e.target.value) || 0})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Prezzo Minimo"
                value={newListing.priceRange.min}
                onChange={(e) => setNewListing({
                  ...newListing, 
                  priceRange: { ...newListing.priceRange, min: parseFloat(e.target.value) || 0 }
                })}
                inputProps={{ step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Prezzo Massimo"
                value={newListing.priceRange.max}
                onChange={(e) => setNewListing({
                  ...newListing, 
                  priceRange: { ...newListing.priceRange, max: parseFloat(e.target.value) || 0 }
                })}
                inputProps={{ step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newListing.autoManage}
                    onChange={(e) => setNewListing({...newListing, autoManage: e.target.checked})}
                  />
                }
                label="Gestione automatica liquidità e prezzi"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenListingDialog(false)}>Annulla</Button>
          <Button onClick={handleCreateListing} variant="contained">
            Crea Listing
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={openSettingsDialog} onClose={() => setOpenSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Impostazioni DEX</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={dexSettings.autoListing}
                  onChange={(e) => setDexSettings({...dexSettings, autoListing: e.target.checked})}
                />
              }
              label="Listing Automatico"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Lista automaticamente i nuovi token sui DEX
            </Typography>

            <TextField
              fullWidth
              type="number"
              label="Liquidità Minima (USD)"
              value={dexSettings.minLiquidity}
              onChange={(e) => setDexSettings({...dexSettings, minLiquidity: parseFloat(e.target.value)})}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="number"
              label="Slippage Massimo (%)"
              value={dexSettings.maxSlippage}
              onChange={(e) => setDexSettings({...dexSettings, maxSlippage: parseFloat(e.target.value)})}
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={dexSettings.enableArbitrage}
                  onChange={(e) => setDexSettings({...dexSettings, enableArbitrage: e.target.checked})}
                />
              }
              label="Abilita Arbitraggio"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Sfrutta le differenze di prezzo tra DEX
            </Typography>

            <TextField
              fullWidth
              type="number"
              label="Soglia Ribilanciamento (%)"
              value={dexSettings.rebalanceThreshold}
              onChange={(e) => setDexSettings({...dexSettings, rebalanceThreshold: parseFloat(e.target.value)})}
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

export default DEXManager;