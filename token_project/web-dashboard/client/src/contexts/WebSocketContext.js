import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: maxReconnectAttempts
    });

    newSocket.on('connect', () => {
      console.log('🔗 WebSocket connected');
      setConnected(true);
      setReconnectAttempts(0);
      toast.success('Connesso al server', {
        position: 'bottom-right',
        autoClose: 3000
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        newSocket.connect();
      }
      
      toast.warning('Connessione persa', {
        position: 'bottom-right',
        autoClose: 3000
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚫 WebSocket connection error:', error);
      setConnected(false);
      setReconnectAttempts(prev => prev + 1);
      
      if (reconnectAttempts >= maxReconnectAttempts) {
        toast.error('Impossibile connettersi al server', {
          position: 'bottom-right',
          autoClose: 5000
        });
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      setReconnectAttempts(0);
      toast.success('Riconnesso al server', {
        position: 'bottom-right',
        autoClose: 3000
      });
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
      setReconnectAttempts(attemptNumber);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('🚫 WebSocket reconnection failed');
      setConnected(false);
      toast.error('Riconnessione fallita', {
        position: 'bottom-right',
        autoClose: 5000
      });
    });

    // Custom events
    newSocket.on('stats-update', (data) => {
      console.log('📊 Stats update received:', data);
    });

    newSocket.on('alert', (data) => {
      console.log('🚨 Alert received:', data);
      toast.warning(`Alert: ${data.message}`, {
        position: 'bottom-right',
        autoClose: 8000
      });
    });

    newSocket.on('price-alert', (data) => {
      console.log('💰 Price alert received:', data);
      toast.info(`Prezzo LUNA: $${data.price} (${data.change > 0 ? '+' : ''}${data.change.toFixed(2)}%)`, {
        position: 'bottom-right',
        autoClose: 6000
      });
    });

    newSocket.on('volume-alert', (data) => {
      console.log('📈 Volume alert received:', data);
      toast.info(`Volume 24h: $${data.volume.toLocaleString()}`, {
        position: 'bottom-right',
        autoClose: 6000
      });
    });

    newSocket.on('liquidity-alert', (data) => {
      console.log('💧 Liquidity alert received:', data);
      toast.warning(`Liquidità bassa: $${data.liquidity.toLocaleString()}`, {
        position: 'bottom-right',
        autoClose: 8000
      });
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      newSocket.close();
    };
  }, []);

  const subscribe = (channel) => {
    if (socket && connected) {
      socket.emit('subscribe', { channel });
      console.log(`📡 Subscribed to channel: ${channel}`);
    }
  };

  const unsubscribe = (channel) => {
    if (socket && connected) {
      socket.emit('unsubscribe', { channel });
      console.log(`📡 Unsubscribed from channel: ${channel}`);
    }
  };

  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
      console.log(`📤 Emitted event: ${event}`, data);
    } else {
      console.warn('⚠️ Cannot emit event - socket not connected');
    }
  };

  const value = {
    socket,
    connected,
    reconnectAttempts,
    maxReconnectAttempts,
    subscribe,
    unsubscribe,
    emit
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;