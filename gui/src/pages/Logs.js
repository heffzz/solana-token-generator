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
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Schedule as ScheduleIcon,
  Computer as SystemIcon,
  Token as TokenIcon,
  AccountBalance as DaoIcon,
  TrendingUp as TrendingUpIcon,
  BugReport as BugIcon,
  Security as SecurityIcon,
  Speed as PerformanceIcon
} from '@mui/icons-material';
import { useSystem } from '../context/SystemContext';

const Logs = () => {
  const { logs } = useSystem();
  
  const [tabValue, setTabValue] = useState(0);
  const [logFilter, setLogFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState(false);

  const logLevels = [
    { value: 'all', label: 'Tutti', color: 'default', icon: <InfoIcon /> },
    { value: 'error', label: 'Errori', color: 'error', icon: <ErrorIcon /> },
    { value: 'warning', label: 'Avvisi', color: 'warning', icon: <WarningIcon /> },
    { value: 'info', label: 'Info', color: 'info', icon: <InfoIcon /> },
    { value: 'success', label: 'Successi', color: 'success', icon: <SuccessIcon /> }
  ];

  const logSources = [
    { value: 'all', label: 'Tutte le Sorgenti', icon: <SystemIcon /> },
    { value: 'system', label: 'Sistema', icon: <SystemIcon /> },
    { value: 'tokenGenerator', label: 'Token Generator', icon: <TokenIcon /> },
    { value: 'dao', label: 'DAO', icon: <DaoIcon /> }
  ];

  const dateFilters = [
    { value: 'today', label: 'Oggi' },
    { value: 'yesterday', label: 'Ieri' },
    { value: 'week', label: 'Ultima Settimana' },
    { value: 'month', label: 'Ultimo Mese' },
    { value: 'all', label: 'Tutti' }
  ];

  const logCategories = [
    { id: 'security', name: 'Sicurezza', icon: <SecurityIcon />, color: 'error' },
    { id: 'performance', name: 'Performance', icon: <PerformanceIcon />, color: 'warning' },
    { id: 'bugs', name: 'Bug', icon: <BugIcon />, color: 'error' },
    { id: 'general', name: 'Generale', icon: <InfoIcon />, color: 'info' }
  ];

  useEffect(() => {
    // Auto refresh logs
    const interval = setInterval(() => {
      if (autoRefresh) {
        // Trigger log refresh
        console.log('Refreshing logs...');
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getAllLogs = () => {
    const allLogs = [
      ...(logs.system || []).map(log => ({ ...log, source: 'system' })),
      ...(logs.tokenGenerator || []).map(log => ({ ...log, source: 'tokenGenerator' })),
      ...(logs.dao || []).map(log => ({ ...log, source: 'dao' }))
    ];
    
    return allLogs
      .filter(log => {
        // Level filter
        if (logFilter !== 'all' && log.level !== logFilter) return false;
        
        // Source filter
        if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
        
        // Search filter
        if (logSearch && !log.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
        
        // Date filter
        if (dateFilter !== 'all') {
          const logDate = new Date(log.timestamp);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          switch (dateFilter) {
            case 'today':
              if (logDate < today) return false;
              break;
            case 'yesterday':
              const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
              if (logDate < yesterday || logDate >= today) return false;
              break;
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              if (logDate < weekAgo) return false;
              break;
            case 'month':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              if (logDate < monthAgo) return false;
              break;
          }
        }
        
        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getLogIcon = (level) => {
    const levelConfig = logLevels.find(l => l.value === level);
    return levelConfig ? levelConfig.icon : <InfoIcon />;
  };

  const getLogColor = (level) => {
    const levelConfig = logLevels.find(l => l.value === level);
    return levelConfig ? levelConfig.color : 'default';
  };

  const getSourceIcon = (source) => {
    const sourceConfig = logSources.find(s => s.value === source);
    return sourceConfig ? sourceConfig.icon : <SystemIcon />;
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'system': return 'primary';
      case 'tokenGenerator': return 'secondary';
      case 'dao': return 'info';
      default: return 'default';
    }
  };

  const getLogStats = () => {
    const allLogs = getAllLogs();
    const stats = {
      total: allLogs.length,
      error: allLogs.filter(log => log.level === 'error').length,
      warning: allLogs.filter(log => log.level === 'warning').length,
      info: allLogs.filter(log => log.level === 'info').length,
      success: allLogs.filter(log => log.level === 'success').length
    };
    return stats;
  };

  const exportLogs = () => {
    const logsToExport = getAllLogs();
    const csvContent = [
      'Timestamp,Level,Source,Message,Details',
      ...logsToExport.map(log => 
        `"${log.timestamp}","${log.level}","${log.source}","${log.message.replace(/"/g, '""')}","${(log.details || '').replace(/"/g, '""')}"`
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

  const clearFilters = () => {
    setLogFilter('all');
    setSourceFilter('all');
    setLogSearch('');
    setDateFilter('today');
    setPage(0);
  };

  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const renderLogStats = () => {
    const stats = getLogStats();
    
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">Totali</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main">
                {stats.error}
              </Typography>
              <Typography variant="body2" color="text.secondary">Errori</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main">
                {stats.warning}
              </Typography>
              <Typography variant="body2" color="text.secondary">Avvisi</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">
                {stats.info}
              </Typography>
              <Typography variant="body2" color="text.secondary">Info</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {stats.success}
              </Typography>
              <Typography variant="body2" color="text.secondary">Successi</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderLogTable = () => {
    const filteredLogs = getAllLogs();
    const paginatedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Livello</TableCell>
                <TableCell>Sorgente</TableCell>
                <TableCell>Messaggio</TableCell>
                <TableCell align="center">Azioni</TableCell>
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
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getSourceIcon(log.source)}
                      <Chip 
                        label={log.source} 
                        color={getSourceColor(log.source)} 
                        size="small" 
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.message}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Visualizza Dettagli">
                      <IconButton size="small" onClick={() => viewLogDetails(log)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

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

  const renderLogList = () => {
    const filteredLogs = getAllLogs();
    const paginatedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <Box>
        <List>
          {paginatedLogs.map((log, index) => (
            <React.Fragment key={`${log.source}-${index}`}>
              <ListItem
                sx={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: 'rgba(255,255,255,0.02)'
                }}
              >
                <ListItemIcon>
                  {getLogIcon(log.level)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip 
                        label={log.level.toUpperCase()} 
                        color={getLogColor(log.level)} 
                        size="small"
                      />
                      <Chip 
                        label={log.source} 
                        color={getSourceColor(log.source)} 
                        size="small" 
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2">
                      {log.message}
                    </Typography>
                  }
                />
                <IconButton onClick={() => viewLogDetails(log)}>
                  <ViewIcon />
                </IconButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>

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

  const renderLogDetails = () => (
    <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {selectedLog && getLogIcon(selectedLog.level)}
          Dettagli Log
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedLog && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Timestamp</Typography>
                <Typography variant="body1">{new Date(selectedLog.timestamp).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="subtitle2" color="text.secondary">Livello</Typography>
                <Chip 
                  label={selectedLog.level.toUpperCase()} 
                  color={getLogColor(selectedLog.level)} 
                  size="small"
                />
              </Grid>
              <Grid item xs={3}>
                <Typography variant="subtitle2" color="text.secondary">Sorgente</Typography>
                <Chip 
                  label={selectedLog.source} 
                  color={getSourceColor(selectedLog.source)} 
                  size="small" 
                  variant="outlined"
                />
              </Grid>
            </Grid>
            
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Messaggio
            </Typography>
            <Paper sx={{ p: 2, mb: 2, backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <Typography variant="body1">
                {selectedLog.message}
              </Typography>
            </Paper>
            
            {selectedLog.details && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Dettagli Aggiuntivi
                </Typography>
                <Paper sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedLog.details}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetailsOpen(false)}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" className="gradient-text">
          Log Sistema
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
      </Box>

      {/* Stats */}
      {renderLogStats()}

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Accordion expanded={expandedAccordion} onChange={() => setExpandedAccordion(!expandedAccordion)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Filtri e Controlli</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
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
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Livello</InputLabel>
                    <Select
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                    >
                      {logLevels.map((level) => (
                        <MenuItem key={level.value} value={level.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {level.icon}
                            {level.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sorgente</InputLabel>
                    <Select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                    >
                      {logSources.map((source) => (
                        <MenuItem key={source.value} value={source.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {source.icon}
                            {source.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Periodo</InputLabel>
                    <Select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    >
                      {dateFilters.map((filter) => (
                        <MenuItem key={filter.value} value={filter.value}>
                          {filter.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={exportLogs}
                      size="small"
                      fullWidth
                    >
                      Esporta
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={clearFilters}
                      size="small"
                      fullWidth
                    >
                      Reset
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Vista Tabella" />
          <Tab label="Vista Lista" />
        </Tabs>
      </Paper>

      {/* Log Content */}
      {tabValue === 0 && renderLogTable()}
      {tabValue === 1 && renderLogList()}

      {/* Log Details Dialog */}
      {renderLogDetails()}
    </Box>
  );
};

export default Logs;