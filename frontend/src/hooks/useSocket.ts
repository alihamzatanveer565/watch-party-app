'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        transports: ['websocket'],
        autoConnect: true,
      });
    }
    socketRef.current = socketInstance;

    return () => {
      // Don't disconnect on component unmount — the socket lives at module level
      // Disconnect only when navigating away from room
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  }, []);

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  return { socket: socketRef.current, emit, on, off };
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
