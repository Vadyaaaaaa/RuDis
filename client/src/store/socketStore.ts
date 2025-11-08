import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';

interface SocketState {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  socket: null,
  connect: () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      // Если нет токена, создаем гостевой
      const guestToken = 'guest-token-' + Date.now();
      const socket = io('http://localhost:3001', {
        auth: { token: guestToken },
      });
      socket.on('connect', () => {
        console.log('Подключено к серверу (гость)');
      });
      socket.on('disconnect', () => {
        console.log('Отключено от сервера');
      });
      set({ socket });
      return;
    }

    const socket = io('http://localhost:3001', {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('Подключено к серверу');
    });

    socket.on('disconnect', () => {
      console.log('Отключено от сервера');
    });

    set({ socket });
  },
  disconnect: () => {
    const { socket } = useSocketStore.getState();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));

