import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const activeRooms = useRef(new Set());

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection with JWT auth
    const newSocket = io(SOCKET_SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to real-time telemetry gateway. ID:', newSocket.id);
      setIsConnected(true);

      // Re-join any previously tracked trip rooms upon reconnection
      activeRooms.current.forEach((tripId) => {
        newSocket.emit('join:trip', tripId);
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected from server. Reason:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection Error:', err.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  const joinTrip = (tripId) => {
    if (!tripId) return;
    activeRooms.current.add(tripId);
    if (socket && isConnected) {
      socket.emit('join:trip', tripId);
    }
  };

  const leaveTrip = (tripId) => {
    if (!tripId) return;
    activeRooms.current.delete(tripId);
    if (socket && isConnected) {
      socket.emit('leave:trip', tripId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinTrip,
        leaveTrip,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
