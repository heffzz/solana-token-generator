import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Token as TokenIcon,
  HowToVote as VoteIcon,
  TrendingUp as TrendingIcon,
  Monitor as MonitorIcon,
  Settings as SettingsIcon,
  Description as LogsIcon,
  Rocket as RocketIcon,
  AccountBalanceWallet as PhantomIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSystem } from '../context/SystemContext';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Token Generator', icon: <TokenIcon />, path: '/token-generator' },
  { text: 'DAO Governance', icon: <VoteIcon />, path: '/dao' },
  { text: 'DEX Manager', icon: <TrendingIcon />, path: '/dex' },
  { text: 'Monitor', icon: <MonitorIcon />, path: '/monitor' },
  { text: 'Phantom Wallet', icon: <PhantomIcon />, path: '/phantom-wallet' },
  { text: 'Logs', icon: <LogsIcon />, path: '/logs' },
  { text: 'Impostazioni', icon: <SettingsIcon />, path: '/settings' }
];

const Sidebar = ({ open, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { systemStatus } = useSystem();

  const drawerWidth = open ? 280 : 80;

  const getStatusColor = () => {
    if (systemStatus.tokenGenerator && systemStatus.dao) return 'success';
    if (systemStatus.tokenGenerator || systemStatus.dao) return 'warning';
    return 'error';
  };

  const getStatusText = () => {
    if (systemStatus.tokenGenerator && systemStatus.dao) return 'Tutto Attivo';
    if (systemStatus.tokenGenerator || systemStatus.dao) return 'Parzialmente Attivo';
    return 'Inattivo';
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #1a1f3a 0%, #0a0e27 100%)',
          borderRight: '1px solid rgba(102, 126, 234, 0.2)',
          transition: 'width 0.3s ease',
          overflowX: 'hidden'
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          minHeight: 64
        }}
      >
        <RocketIcon 
          sx={{ 
            color: '#667eea', 
            fontSize: 32,
            mr: open ? 1 : 0
          }} 
        />
        {open && (
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              LUNACOIN
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sistema Autonomo
            </Typography>
          </Box>
        )}
      </Box>

      {/* Status Indicator */}
      {open && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Chip
            label={getStatusText()}
            color={getStatusColor()}
            size="small"
            sx={{ width: '100%' }}
          />
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(102, 126, 234, 0.2)' }} />

      {/* Menu Items */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(102, 126, 234, 0.4)' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    border: '1px solid rgba(102, 126, 234, 0.3)'
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                    color: isActive ? '#667eea' : 'text.secondary'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && (
                  <ListItemText 
                    primary={item.text}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: '0.9rem',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? '#667eea' : 'text.primary'
                      }
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      {open && (
        <Box sx={{ p: 2, borderTop: '1px solid rgba(102, 126, 234, 0.2)' }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            LUNACOIN v1.0.0
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Sistema Autonomo SPL
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default Sidebar;