const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const friendsRoutes = require('./routes/friends');
const { initializeDatabase } = require('./database/db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendsRoutes);

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-server', (serverId) => {
    socket.join(`server-${serverId}`);
    console.log(`User ${socket.id} joined server ${serverId}`);
  });

  socket.on('join-channel', (channelId) => {
    socket.join(`channel-${channelId}`);
    console.log(`User ${socket.id} joined channel ${channelId}`);
  });

  socket.on('send-message', (data) => {
    io.to(`channel-${data.channelId}`).emit('new-message', data);
  });

  socket.on('typing', (data) => {
    socket.to(`channel-${data.channelId}`).emit('user-typing', {
      userId: data.userId,
      username: data.username,
      channelId: data.channelId
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(`channel-${data.channelId}`).emit('user-stop-typing', {
      userId: data.userId,
      channelId: data.channelId
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`RuDis server running on port ${PORT}`);
});

