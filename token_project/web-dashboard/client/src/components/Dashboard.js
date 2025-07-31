import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  People,
  SwapHoriz,
  Timeline
} from '@mui/icons-material';
import CountUp from 'react-countup';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useWebSocket } from '../contexts/WebSocketContext';
import axios from 'axios';
import moment from 'moment';
import numeral from 'numeral';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StatCard = ({ title, value, change, icon, color, prefix = '', suffix = '' }) => {
  const isPositive = change >= 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {prefix}
              <CountUp
                end={value}
                duration={2}
                separator=","
                decimals={title.includes('Price') ? 6 : 0}
              />
              {suffix}
            </Typography>
            {change !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                {isPositive ? (
                  <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color: isPositive ? 'success.main' : 'error.main',
                    fontWeight: 'medium'
                  }}
                >
                  {isPositive ? '+' : ''}{change.toFixed(2)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={
              {
                backgroundColor: `${color}.light`,
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            }
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const MiniChart = ({ data, color }) => {
  const chartData = {
    labels: data.map(item => moment(item.timestamp).format('HH:mm')),
    datasets: [
      {
        data: data.map(item => item.price),
        borderColor: color,
        backgroundColor: `${color}20`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `Price: $${context.parsed.y.toFixed(6)}`
        }
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: false
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <Box sx={{ height: 100, mt: 2 }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, connected } = useWebSocket();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (socket && connected) {
      socket.emit('subscribe', { channel: 'token-stats' });
      
      socket.on('stats-update', (newStats) => {
        setStats(newStats);
      });

      return () => {
        socket.emit('unsubscribe', { channel: 'token-stats' });
        socket.off('stats-update');
      };
    }
  }, [socket, connected]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [statsResponse, historyResponse] = await Promise.all([
        axios.get('/api/token/stats'),
        axios.get('/api/token/history?period=24h')
      ]);
      
      setStats(statsResponse.data);
      setHistory(historyResponse.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const mockStats = stats || {
    price: 0.000001,
    priceChange24h: 5.67,
    volume24h: 125000,
    volumeChange24h: 12.3,
    marketCap: 1000000,
    marketCapChange24h: 5.67,
    holders: 1250,
    holdersChange24h: 8.9,
    transactions24h: 450,
    transactionsChange24h: 15.2,
    liquidity: 500000,
    liquidityChange24h: 3.4
  };

  const mockHistory = history.length > 0 ? history : Array.from({ length: 24 }, (_, i) => ({
    timestamp: moment().subtract(23 - i, 'hours').toISOString(),
    price: 0.000001 * (1 + (Math.random() - 0.5) * 0.1)
  }));

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard Overview
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={connected ? 'Live' : 'Disconnesso'}
            color={connected ? 'success' : 'error'}
            size="small"
            variant="outlined"
          />
          <Typography variant="body2" color="textSecondary">
            Ultimo aggiornamento: {moment().format('HH:mm:ss')}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Price */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Prezzo LUNA"
            value={mockStats.price}
            change={mockStats.priceChange24h}
            icon={<Timeline sx={{ color: 'primary.main' }} />}
            color="primary"
            prefix="$"
          />
        </Grid>

        {/* Volume */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Volume 24h"
            value={mockStats.volume24h}
            change={mockStats.volumeChange24h}
            icon={<SwapHoriz sx={{ color: 'secondary.main' }} />}
            color="secondary"
            prefix="$"
          />
        </Grid>

        {/* Market Cap */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Market Cap"
            value={mockStats.marketCap}
            change={mockStats.marketCapChange24h}
            icon={<AccountBalance sx={{ color: 'info.main' }} />}
            color="info"
            prefix="$"
          />
        </Grid>

        {/* Holders */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Holders"
            value={mockStats.holders}
            change={mockStats.holdersChange24h}
            icon={<People sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>

        {/* Transactions */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Transazioni 24h"
            value={mockStats.transactions24h}
            change={mockStats.transactionsChange24h}
            icon={<SwapHoriz sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>

        {/* Liquidity */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Liquidità Totale"
            value={mockStats.liquidity}
            change={mockStats.liquidityChange24h}
            icon={<AccountBalance sx={{ color: 'error.main' }} />}
            color="error"
            prefix="$"
          />
        </Grid>

        {/* Price Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Andamento Prezzo (24h)
            </Typography>
            <MiniChart data={mockHistory} color="#9945FF" />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;