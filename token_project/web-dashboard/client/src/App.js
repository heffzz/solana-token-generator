import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Paper,
  Box,
  Switch,
  FormControlLabel
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Dashboard from './components/Dashboard';
import TokenInfo from './components/TokenInfo';
import Charts from './components/Charts';
import DEXPools from './components/DEXPools';
import Alerts from './components/Alerts';
import Reports from './components/Reports';
import Navigation from './components/Navigation';
import WebSocketProvider from './contexts/WebSocketContext';

// Theme
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#9945FF',
      light: '#B366FF',
      dark: '#7A2FCC'
    },
    secondary: {
      main: '#14F195',
      light: '#4DF4A7',
      dark: '#0FC17A'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 12
  }
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9945FF',
      light: '#B366FF',
      dark: '#7A2FCC'
    },
    secondary: {
      main: '#14F195',
      light: '#4DF4A7',
      dark: '#0FC17A'
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 12
  }
});

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WebSocketProvider>
        <Router>
          <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" elevation={0}>
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  🌙 LUNACOIN Dashboard
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      color="secondary"
                    />
                  }
                  label="Dark Mode"
                />
              </Toolbar>
            </AppBar>
            
            <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={2}>
                  <Navigation />
                </Grid>
                <Grid item xs={12} md={10}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/token" element={<TokenInfo />} />
                    <Route path="/charts" element={<Charts />} />
                    <Route path="/dex" element={<DEXPools />} />
                    <Route path="/alerts" element={<Alerts />} />
                    <Route path="/reports" element={<Reports />} />
                  </Routes>
                </Grid>
              </Grid>
            </Container>
          </Box>
          
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={darkMode ? 'dark' : 'light'}
          />
        </Router>
      </WebSocketProvider>
    </ThemeProvider>
  );
}

export default App;