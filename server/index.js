import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import db from './database.js';
import authRoutes from './routes/auth.js';
import serverRoutes from './routes/servers.js';
import channelRoutes from './routes/channels.js';
import messageRoutes from './routes/messages.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Роуты
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io подключения
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Токен отсутствует'));
  }

  // Поддержка гостевых пользователей
  if (token.startsWith('guest-token-')) {
    const guestId = token.replace('guest-token-', '');
    socket.userId = `guest-${guestId}`;
    socket.username = 'Гость';
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Недействительный токен'));
    }
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`Пользователь подключен: ${socket.username} (${socket.userId})`);

  // Присоединение к комнатам каналов
  socket.on('join_channel', async (channelId) => {
    try {
      const channel = await db.get('SELECT * FROM channels WHERE id = ?', [channelId]);
      if (!channel) {
        return socket.emit('error', { message: 'Канал не найден' });
      }

      const member = await db.get(
        `SELECT * FROM server_members sm
         WHERE sm.server_id = ? AND sm.user_id = ?`,
        [channel.server_id, socket.userId]
      );

      if (!member) {
        return socket.emit('error', { message: 'Нет доступа к каналу' });
      }

      socket.join(`channel:${channelId}`);
      socket.emit('joined_channel', channelId);
    } catch (error) {
      console.error('Ошибка присоединения к каналу:', error);
      socket.emit('error', { message: 'Ошибка присоединения к каналу' });
    }
  });

  // Покинуть канал
  socket.on('leave_channel', (channelId) => {
    socket.leave(`channel:${channelId}`);
  });

  // Отправка сообщения
  socket.on('send_message', async (data) => {
    try {
      const { channelId, content, attachment } = data;

      if (!channelId || !content) {
        return socket.emit('error', { message: 'ID канала и содержимое обязательны' });
      }

      const channel = await db.get('SELECT * FROM channels WHERE id = ?', [channelId]);
      if (!channel) {
        return socket.emit('error', { message: 'Канал не найден' });
      }

      const member = await db.get(
        `SELECT * FROM server_members sm
         WHERE sm.server_id = ? AND sm.user_id = ?`,
        [channel.server_id, socket.userId]
      );

      if (!member) {
        return socket.emit('error', { message: 'Нет доступа к каналу' });
      }

      const messageId = uuidv4();

      await db.run(
        'INSERT INTO messages (id, channel_id, user_id, content, attachment) VALUES (?, ?, ?, ?, ?)',
        [messageId, channelId, socket.userId, content, attachment || null]
      );

      const message = await db.get(
        `SELECT m.*, u.username, u.avatar
         FROM messages m
         INNER JOIN users u ON m.user_id = u.id
         WHERE m.id = ?`,
        [messageId]
      );

      // Отправка сообщения всем в канале
      io.to(`channel:${channelId}`).emit('new_message', message);
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      socket.emit('error', { message: 'Ошибка отправки сообщения' });
    }
  });

  // Типизация (пользователь печатает)
  socket.on('typing_start', (channelId) => {
    socket.to(`channel:${channelId}`).emit('user_typing', {
      userId: socket.userId,
      username: socket.username,
    });
  });

  socket.on('typing_stop', (channelId) => {
    socket.to(`channel:${channelId}`).emit('user_stopped_typing', {
      userId: socket.userId,
    });
  });

  // Голосовые звонки
  const activeCalls = new Map(); // channelId -> Set of userIds

  socket.on('start-call', (data) => {
    const { channelId } = data;
    if (!activeCalls.has(channelId)) {
      activeCalls.set(channelId, new Set());
    }
    activeCalls.get(channelId).add(socket.userId);
    
    // Уведомляем других пользователей в канале
    socket.to(`channel:${channelId}`).emit('user-joined-call', {
      userId: socket.userId,
      username: socket.username,
    });
  });

  socket.on('join-call', (data) => {
    const { channelId } = data;
    if (!activeCalls.has(channelId)) {
      activeCalls.set(channelId, new Set());
    }
    activeCalls.get(channelId).add(socket.userId);
    
    // Получаем список участников звонка
    const participants = Array.from(activeCalls.get(channelId));
    socket.emit('call-users', participants);
    
    // Уведомляем других пользователей
    socket.to(`channel:${channelId}`).emit('user-joined-call', {
      userId: socket.userId,
      username: socket.username,
    });
  });

  socket.on('leave-call', (data) => {
    const { channelId } = data;
    if (activeCalls.has(channelId)) {
      activeCalls.get(channelId).delete(socket.userId);
      if (activeCalls.get(channelId).size === 0) {
        activeCalls.delete(channelId);
      }
    }
    
    socket.to(`channel:${channelId}`).emit('user-left-call', {
      userId: socket.userId,
    });
  });

  socket.on('get-call-users', (channelId, callback) => {
    if (activeCalls.has(channelId)) {
      callback(Array.from(activeCalls.get(channelId)));
    } else {
      callback([]);
    }
  });

  // WebRTC сигналинг
  socket.on('call-offer', (data) => {
    const { to, offer, channelId } = data;
    socket.to(`user:${to}`).emit('call-offer', {
      from: socket.userId,
      offer,
      channelId,
    });
  });

  socket.on('call-answer', (data) => {
    const { to, answer, channelId } = data;
    socket.to(`user:${to}`).emit('call-answer', {
      from: socket.userId,
      answer,
      channelId,
    });
  });

  socket.on('ice-candidate', (data) => {
    const { to, candidate, channelId } = data;
    socket.to(`user:${to}`).emit('ice-candidate', {
      from: socket.userId,
      candidate,
      channelId,
    });
  });

  socket.on('disconnect', () => {
    console.log(`Пользователь отключен: ${socket.username}`);
    
    // Удаляем из всех активных звонков
    activeCalls.forEach((users, channelId) => {
      if (users.has(socket.userId)) {
        users.delete(socket.userId);
        socket.to(`channel:${channelId}`).emit('user-left-call', {
          userId: socket.userId,
        });
        if (users.size === 0) {
          activeCalls.delete(channelId);
        }
      }
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

