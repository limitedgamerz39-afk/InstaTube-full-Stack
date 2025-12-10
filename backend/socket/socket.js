import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5001', // Add this missing origin
        'http://localhost:5002',
        'http://192.168.1.3:5001', // Add this for network access
        'http://192.168.1.3:5002',
        'http://192.168.1.3:3000', // Add this for mobile app access
        // Add your public IP here for self-hosting
        'http://YOUR_PUBLIC_IP:5001',
        'http://YOUR_PUBLIC_IP:3000',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    // Add connection timeout settings
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    transports: ['websocket', 'polling'], // Allow both websocket and polling
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

    // Live Stream Events
    socket.on('joinLiveStream', ({ streamId, userId }) => {
      if (streamId && userId) {
        // Join the stream room
        socket.join(`stream_${streamId}`);
        
        // Emit viewer count update to all viewers in this stream
        const room = io.sockets.adapter.rooms.get(`stream_${streamId}`);
        const viewerCount = room ? room.size : 0;
        
        io.to(`stream_${streamId}`).emit('viewerCountUpdate', viewerCount);
      }
    });

    socket.on('leaveLiveStream', ({ streamId, userId }) => {
      if (streamId && userId) {
        // Leave the stream room
        socket.leave(`stream_${streamId}`);
        
        // Emit viewer count update to all viewers in this stream
        const room = io.sockets.adapter.rooms.get(`stream_${streamId}`);
        const viewerCount = room ? room.size : 0;
        
        io.to(`stream_${streamId}`).emit('viewerCountUpdate', viewerCount);
      }
    });

    socket.on('sendStreamComment', ({ streamId, comment }) => {
      if (streamId && comment) {
        // Emit comment to all viewers in this stream
        io.to(`stream_${streamId}`).emit('streamComment', comment);
      }
    });

    socket.on('sendStreamLike', ({ streamId, userId }) => {
      if (streamId && userId) {
        // Emit like to all viewers in this stream
        io.to(`stream_${streamId}`).emit('streamLike', { userId });
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