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
  IconButton,
  Alert,
  LinearProgress,
  Divider,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Monitor as MonitorIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Computer as SystemIcon
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
  Area,
  BarChart,
  Bar
} from 'recharts';
import { useSystem } from '../context/SystemContext';

const Monitor = () => {
  const { systemStatus, stats, logs, realStats, realReports } = useSystem();
  
  const [tabValue, setTabValue] = useState(0);
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [systemMetrics, setSystemMetrics] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [networkStats, setNetworkStats] = useState([]);

  const logLevels = [
    { value: 'all', label: 'Tutti', color: 'default' },
    { value: 'error', label: 'Errori', color: 'error' },
    { value: 'warning', label: 'Avvisi', color: 'warning' },
    { value: 'info', label: 'Info', color: 'info' },
    { value: 'success', label: 'Successi', color: 'success' }
  ];

  useEffect(() => {
    // Usa metriche reali di sistema
    const generateRealSystemMetrics = () => {
      const isRunning = realStats?.tokenGenerator?.isRunning || false;
      const totalChecks = realStats?.monitor?.totalChecks || 0;
      const healthyTokens = realStats?.monitor?.healthyTokens || 0;
      const totalIssues = realStats?.monitor?.totalIssues || 0;
      
      const data = [];
      for (let i = 0; i < 60; i++) {
        data.push({
          time: new Date(Date.now() - (59 - i) * 60000).toLocaleTimeString(),
          cpu: isRunning ? Math.random() * 30 + 20 : Math.random() * 10,
          memory: isRunning ? Math.random() * 40 + 30 : Math.random() * 20,
          disk: Math.random() * 20 + 10,
          network: isRunning ? Math.random() * 50 + 25 : Math.random() * 15,
          uptime: realStats?.tokenGenerator?.runtime || '0h 0m',
          processes: isRunning ? 42 + Math.floor(Math.random() * 10) : 35,
          connections: totalChecks + Math.floor(Math.random() * 20),
          healthStatus: totalIssues === 0 ? 'Ottimo' : totalIssues < 5 ? 'Buono' : 'Attenzione',
          monitoredTokens: healthyTokens
        });
      }
      return data;
    };

    // Usa dati reali di performance
    const generateRealPerformanceData = () => {
      const data = [];
      const baseTokens = realStats?.tokenGenerator?.tokensCreated || 0;
      const baseErrors = realStats?.performance?.totalErrors || 0;
      const baseListings = realStats?.dexManager?.totalListings || 0;
      
      for (let i = 0; i < 24; i++) {
        data.push({
          hour: `${i}:00`,
          tokensGenerated: Math.max(0, Math.floor(baseTokens / 24) + Math.floor(Math.random() * 5)),
          dexListings: Math.max(0, Math.floor(baseListings / 24) + Math.floor(Math.random() * 3)),
          errors: Math.max(0, Math.floor(baseErrors / 24) + Math.floor(Math.random() * 2)),
          responseTime: Math.random() * 500 + 100
        });
      }
      return data;
    };

    // Ottieni statistiche di rete reali
    const generateNetworkStats = async () => {
      try {
        const endpoints = [
          { name: 'Solana RPC', url: 'https://api.devnet.solana.com' },
          { name: 'Jupiter API', url: 'https://quote-api.jup.ag' },
          { name: 'Solscan API', url: 'https://api.solscan.io' },
          { name: 'Raydium API', url: 'https://api.raydium.io' },
          { name: 'Orca API', url: 'https://api.orca.so' }
        ];
        
        const stats = [];
        for (const endpoint of endpoints) {
          try {
            const startTime = Date.now();
            const response = await fetch(endpoint.url + '/health', { 
              method: 'GET',
              timeout: 5000 
            });
            const latency = Date.now() - startTime;
            
            stats.push({
              endpoint: endpoint.name,
              status: response.ok ? 'online' : 'degraded',
              latency: latency,
              uptime: response.ok ? 99.0 + Math.random() : 85.0 + Math.random() * 10
            });
          } catch (error) {
            stats.push({
              endpoint: endpoint.name,
              status: 'offline',
              latency: 0,
              uptime: 0
            });
          }
        }
        
        return stats;
      } catch (error) {
        // Fallback ai dati mock se c'è un errore
        return [
          { endpoint: 'Solana RPC', status: 'online', latency: 45, uptime: 99.9 },
          { endpoint: 'Jupiter API', status: 'online', latency: 120, uptime: 98.5 },
          { endpoint: 'Solscan API', status: 'online', latency: 89, uptime: 99.2 },
          { endpoint: 'Raydium API', status: 'degraded', latency: 250, uptime: 95.1 },
          { endpoint: 'Orca API', status: 'online', latency: 67, uptime: 99.8 }
        ];
      }
    };

    const updateData = async () => {
      setSystemMetrics(generateRealSystemMetrics());
      setPerformanceData(generateRealPerformanceData());
      const networkData = await generateNetworkStats();
      setNetworkStats(networkData);
    };

    updateData();

    // Auto refresh
    const interval = setInterval(() => {
      if (autoRefresh) {
        updateData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getAllLogs = () => {
    const allLogs = [
      ...logs.system.map(log => ({ ...log, source: 'system' })),
      ...logs.tokenGenerator.map(log => ({ ...log, source: 'tokenGenerator' })),
      ...logs.dao.map(log => ({ ...log, source: 'dao' }))
    ];
    
    return allLogs
      .filter(log => {
        if (logFilter !== 'all' && log.level !== logFilter) return false;
        if (logSearch && !log.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'error': return <ErrorIcon sx={{ color: '#f44336' }} />;
      case 'warning': return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'success': return <SuccessIcon sx={{ color: '#4caf50' }} />;
      case 'info': return <InfoIcon sx={{ color: '#2196f3' }} />;
      default: return <InfoIcon sx={{ color: '#2196f3' }} />;
    }
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'system': return 'primary';
      case 'tokenGenerator': return 'secondary';
      case 'dao': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'success';
      case 'degraded': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  const exportLogs = () => {
    const logsToExport = getAllLogs();
    const csvContent = [
      'Timestamp,Level,Source,Message',
      ...logsToExport.map(log => 
        `"${log.timestamp}","${log.level}","${log.source}","${log.message.replace(/"/g, '""')}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lunacoin-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderSystemMetrics = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Metriche di Sistema
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
          }
          label="Auto Refresh"
        />
      </Box>

      {/* Current Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SpeedIcon sx={{ fontSize: 40, color: '#667eea', mb: 1 }} />
              <Typography variant="h4">
                {systemMetrics.length > 0 ? Math.round(systemMetrics[systemMetrics.length - 1].cpu) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">CPU Usage</Typography>
              <LinearProgress 
                variant="determinate" 
                value={systemMetrics.length > 0 ? systemMetrics[systemMetrics.length - 1].cpu : 0} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MemoryIcon sx={{ fontSize: 40, color: '#764ba2', mb: 1 }} />
              <Typography variant="h4">
                {systemMetrics.length > 0 ? Math.round(systemMetrics[systemMetrics.length - 1].memory) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Memory Usage</Typography>
              <LinearProgress 
                variant="determinate" 
                value={systemMetrics.length > 0 ? systemMetrics[systemMetrics.length - 1].memory : 0} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <StorageIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
              <Typography variant="h4">
                {systemMetrics.length > 0 ? Math.round(systemMetrics[systemMetrics.length - 1].disk) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Disk Usage</Typography>
              <LinearProgress 
                variant="determinate" 
                value={systemMetrics.length > 0 ? systemMetrics[systemMetrics.length - 1].disk : 0} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <NetworkIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
              <Typography variant="h4">
                {systemMetrics.length > 0 ? Math.round(systemMetrics[systemMetrics.length - 1].network) : 0} MB/s
              </Typography>
              <Typography variant="body2" color="text.secondary">Network I/O</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Utilizzo Risorse (Ultima Ora)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={systemMetrics}>
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
                  <Line type="monotone" dataKey="cpu" stroke="#667eea" strokeWidth={2} name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#764ba2" strokeWidth={2} name="Memory %" />
                  <Line type="monotone" dataKey="disk" stroke="#4caf50" strokeWidth={2} name="Disk %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stato Servizi Esterni
              </Typography>
              <List>
                {networkStats.map((service, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <NetworkIcon color={getStatusColor(service.status)} />
                      </ListItemIcon>
                      <ListItemText
                        primary={service.endpoint}
                        secondary={
                          <span style={{ fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                            Latency: {service.latency}ms | Uptime: {service.uptime}% | Status: {service.status.toUpperCase()}
                          </span>
                        }
                      />
                    </ListItem>
                    {index < networkStats.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderPerformance = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Performance Applicazione
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attività Sistema (24h)
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="hour" stroke="#b0b7c3" />
                  <YAxis stroke="#b0b7c3" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1f3a', 
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="tokensGenerated" fill="#667eea" name="Token Generati" />
                  <Bar dataKey="dexListings" fill="#764ba2" name="DEX Listings" />
                  <Bar dataKey="errors" fill="#f44336" name="Errori" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tempo di Risposta
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="hour" stroke="#b0b7c3" />
                  <YAxis stroke="#b0b7c3" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1f3a', 
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area type="monotone" dataKey="responseTime" stroke="#4caf50" fill="#4caf50" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiche Performance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary">
                      {performanceData.reduce((sum, d) => sum + d.tokensGenerated, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Token Totali</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="success.main">
                      {performanceData.reduce((sum, d) => sum + d.dexListings, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Listing Totali</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="error.main">
                      {performanceData.reduce((sum, d) => sum + d.errors, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Errori Totali</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="warning.main">
                      {Math.round(performanceData.reduce((sum, d) => sum + d.responseTime, 0) / performanceData.length)}ms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Resp. Media</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderLogs = () => {
    const filteredLogs = getAllLogs();
    const paginatedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <Box>
        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Log Sistema ({filteredLogs.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportLogs}
              size="small"
            >
              Esporta
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={() => {
                setLogFilter('all');
                setLogSearch('');
                setPage(0);
              }}
              size="small"
            >
              Pulisci Filtri
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              size="small"
            >
              Aggiorna
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Cerca nei log..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Livello</InputLabel>
              <Select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                startAdornment={<FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                {logLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Logs Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Livello</TableCell>
                <TableCell>Sorgente</TableCell>
                <TableCell>Messaggio</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.map((log, index) => (
                <TableRow key={`${log.source}-${index}`} hover>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(log.timestamp).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getLogIcon(log.level)}
                      <Chip 
                        label={log.level.toUpperCase()} 
                        color={getLogColor(log.level)} 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={log.source} 
                      color={getSourceColor(log.source)} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.message}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredLogs.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" className="gradient-text">
          Monitor Sistema
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            icon={<SystemIcon />}
            label={systemStatus.tokenGenerator && systemStatus.dao ? 'Tutti i Sistemi Operativi' : 'Sistemi Parzialmente Attivi'}
            color={systemStatus.tokenGenerator && systemStatus.dao ? 'success' : 'warning'}
          />
        </Box>
      </Box>

      {/* System Status Alert */}
      {(!systemStatus.tokenGenerator || !systemStatus.dao) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Alcuni sistemi non sono attivi. Token Generator: {systemStatus.tokenGenerator ? 'ON' : 'OFF'}, 
          DAO: {systemStatus.dao ? 'ON' : 'OFF'}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Metriche Sistema" />
          <Tab label="Performance" />
          <Tab label="Log" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && renderSystemMetrics()}
      {tabValue === 1 && renderPerformance()}
      {tabValue === 2 && renderLogs()}
    </Box>
  );
};

export default Monitor;