import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import TokenGenerator from './pages/TokenGenerator';
import DAOGovernance from './pages/DAOGovernance';
import DEXManager from './pages/DEXManager';
import Monitor from './pages/Monitor';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import PhantomWallet from './pages/PhantomWallet';
import { SystemProvider } from './context/SystemContext';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#0a0e27',
      paper: '#1a1f3a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b7c3',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #1a1f3a 0%, #2d3561 100%)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          borderRadius: '12px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [systemStatus, setSystemStatus] = useState({
    tokenGenerator: false,
    dao: false,
    connected: false
  });

  useEffect(() => {
    // Verifica se siamo in Electron
    if (window.require && window.require.resolve) {
      try {
        const { ipcRenderer } = window.require('electron');
        
        // Ottieni stato sistema
        ipcRenderer.invoke('get-system-status').then(status => {
          setSystemStatus(prev => ({ ...prev, ...status, connected: true }));
        }).catch(err => {
          console.log('Electron non disponibile, modalità web attiva');
          setSystemStatus(prev => ({ ...prev, connected: true }));
        });

        // Listener per aggiornamenti stato
        ipcRenderer.on('token-generator-stopped', () => {
          setSystemStatus(prev => ({ ...prev, tokenGenerator: false }));
        });

        ipcRenderer.on('token-generator-started', () => {
          setSystemStatus(prev => ({ ...prev, tokenGenerator: true }));
        });

        ipcRenderer.on('dao-stopped', () => {
          setSystemStatus(prev => ({ ...prev, dao: false }));
        });

        ipcRenderer.on('dao-started', () => {
          setSystemStatus(prev => ({ ...prev, dao: true }));
        });

        return () => {
          ipcRenderer.removeAllListeners('token-generator-stopped');
          ipcRenderer.removeAllListeners('token-generator-started');
          ipcRenderer.removeAllListeners('dao-stopped');
          ipcRenderer.removeAllListeners('dao-started');
        };
      } catch (error) {
        console.log('Electron non disponibile, modalità web attiva');
        setSystemStatus(prev => ({ ...prev, connected: true }));
      }
    } else {
      // Modalità web - simula stato connesso
      console.log('Modalità web attiva');
      setSystemStatus(prev => ({ ...prev, connected: true }));
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SystemProvider value={{ systemStatus, setSystemStatus }}>
        <Router>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                transition: 'margin-left 0.3s',
                marginLeft: sidebarOpen ? '280px' : '80px',
                background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
              }}
            >
              <Header onMenuClick={toggleSidebar} systemStatus={systemStatus} />
              <Box sx={{ p: 3 }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/token-generator" element={<TokenGenerator />} />
                  <Route path="/dao" element={<DAOGovernance />} />
                  <Route path="/dex" element={<DEXManager />} />
                  <Route path="/monitor" element={<Monitor />} />
                  <Route path="/phantom-wallet" element={<PhantomWallet />} />
                  <Route path="/logs" element={<Logs />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Box>
            </Box>
          </Box>
        </Router>
      </SystemProvider>
    </ThemeProvider>
  );
}

export default App;