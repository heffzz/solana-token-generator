import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Chip,
  Button,
  Menu,
  MenuItem,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useSystem } from '../context/SystemContext';

const Header = ({ onMenuClick, systemStatus }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const { 
    startTokenGenerator, 
    stopTokenGenerator, 
    startDAO, 
    stopDAO,
    logs 
  } = useSystem();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const getSystemStatusColor = () => {
    if (systemStatus.tokenGenerator && systemStatus.dao) return 'success';
    if (systemStatus.tokenGenerator || systemStatus.dao) return 'warning';
    return 'error';
  };

  const getSystemStatusText = () => {
    const active = [];
    if (systemStatus.tokenGenerator) active.push('Token Gen');
    if (systemStatus.dao) active.push('DAO');
    return active.length > 0 ? active.join(' + ') : 'Sistema Inattivo';
  };

  const getRecentErrors = () => {
    if (!Array.isArray(logs)) return [];
    return logs
      .filter(log => log.level === 'error')
      .slice(-5)
      .reverse();
  };

  const errorCount = getRecentErrors().length;

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        background: 'rgba(26, 31, 58, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(102, 126, 234, 0.2)'
      }}
    >
      <Toolbar>
        {/* Menu Button */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Title */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Sistema di Controllo LUNACOIN
        </Typography>

        {/* System Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={getSystemStatusText()}
            color={getSystemStatusColor()}
            size="small"
            variant="outlined"
          />

          {/* Quick Controls */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={systemStatus.tokenGenerator ? "Ferma Token Generator" : "Avvia Token Generator"}>
              <IconButton
                color="inherit"
                onClick={systemStatus.tokenGenerator ? stopTokenGenerator : startTokenGenerator}
                sx={{
                  backgroundColor: systemStatus.tokenGenerator ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                  '&:hover': {
                    backgroundColor: systemStatus.tokenGenerator ? 'rgba(244, 67, 54, 0.3)' : 'rgba(76, 175, 80, 0.3)'
                  }
                }}
              >
                {systemStatus.tokenGenerator ? <StopIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title={systemStatus.dao ? "Ferma DAO" : "Avvia DAO"}>
              <IconButton
                color="inherit"
                onClick={systemStatus.dao ? stopDAO : startDAO}
                sx={{
                  backgroundColor: systemStatus.dao ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                  '&:hover': {
                    backgroundColor: systemStatus.dao ? 'rgba(244, 67, 54, 0.3)' : 'rgba(76, 175, 80, 0.3)'
                  }
                }}
              >
                {systemStatus.dao ? <StopIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Notifications */}
          <Tooltip title="Notifiche">
            <IconButton color="inherit" onClick={handleNotificationOpen}>
              <Badge badgeContent={errorCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Settings Menu */}
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <SettingsIcon />
          </IconButton>
        </Box>

        {/* Settings Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              background: 'rgba(26, 31, 58, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }
          }}
        >
          <MenuItem onClick={handleMenuClose}>
            <SettingsIcon sx={{ mr: 1 }} />
            Impostazioni
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <InfoIcon sx={{ mr: 1 }} />
            Informazioni
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              background: 'rgba(26, 31, 58, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              maxWidth: 400
            }
          }}
        >
          {errorCount > 0 ? (
            getRecentErrors().map((log, index) => (
              <MenuItem key={index} onClick={handleNotificationClose}>
                <Box>
                  <Typography variant="body2" color="error">
                    {log.message.substring(0, 50)}...
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          ) : (
            <MenuItem onClick={handleNotificationClose}>
              <Typography variant="body2" color="text.secondary">
                Nessuna notifica
              </Typography>
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;