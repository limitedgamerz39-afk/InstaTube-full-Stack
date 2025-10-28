import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Store online users
  const onlineUsers = new Map();

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Join user to their own room
    socket.join(socket.userId);
    onlineUsers.set(socket.userId, socket.id);

    // Emit online users count
    io.emit('onlineUsers', onlineUsers.size);
    
    // Notify all users that this user is online
    io.emit('userOnline', socket.userId);

    // Handle user typing in chat
    socket.on('typing', (data) => {
      const { receiverId } = data;
      if (receiverId) {
        io.to(receiverId).emit('typing', socket.userId);
      }
    });

    // Handle call signaling
    socket.on('call:join', ({ roomId }) => {
      if (roomId) {
        socket.join(roomId);
        io.to(roomId).emit('call:participant', { userId: socket.userId });
      }
    });

    socket.on('call:offer', ({ roomId, offer, from }) => {
      if (roomId && offer) {
        io.to(roomId).emit('call:offer', { offer, from });
      }
    });

    socket.on('call:answer', ({ roomId, answer, from }) => {
      if (roomId && answer) {
        io.to(roomId).emit('call:answer', { answer, from });
      }
    });

    socket.on('call:ice-candidate', ({ roomId, candidate }) => {
      if (roomId && candidate) {
        io.to(roomId).emit('call:ice-candidate', { candidate });
      }
    });

    socket.on('endCall', ({ roomId }) => {
      if (roomId) {
        io.to(roomId).emit('endCall');
      }
    });

    // Call invite/decline forwarding
    socket.on('call:invite', ({ to, roomId, type, from }) => {
      if (to && roomId) {
        io.to(to).emit('call:invite', { roomId, type, from });
      }
    });

    socket.on('call:decline', ({ to, roomId, from }) => {
      if (to && roomId) {
        io.to(to).emit('call:decline', { roomId, from });
      }
    });
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      onlineUsers.delete(socket.userId);
      io.emit('onlineUsers', onlineUsers.size);
      
      // Notify all users that this user is offline
      io.emit('userOffline', socket.userId);
    });
  });

  return io;
};

export default initializeSocket;
