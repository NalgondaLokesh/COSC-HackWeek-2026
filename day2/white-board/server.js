const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();

// ─── MIDDLEWARE ─────────
// CORS for REST endpoints
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(__dirname));

// ─── IN-MEMORY STORAGE ─────────
let canvasData = null;
let userCount = 0;
let drawingUsers = new Set();
let connectedUsers = {};

// ─── HEALTH CHECK ENDPOINT ─────────
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    users: userCount,
    drawing: drawingUsers.size > 0,
    timestamp: new Date().toISOString()
  });
});

// ─── ROOT ENDPOINT ─────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── REGULAR SERVER WITH SOCKET.IO ─────────
  const http = require('http');
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // ─── SOCKET.IO CONNECTION HANDLING ─────────
  io.on('connection', (socket) => {
    userCount++;
    const clientAddress = socket.handshake.address;
    console.log(`🟢 User connected: ${socket.id} (${clientAddress})`);
    console.log(`👥 Total users: ${userCount}`);

    // Store user info
    connectedUsers[socket.id] = {
      id: socket.id,
      address: clientAddress,
      connectedAt: new Date().toISOString()
    };

    // Send current user count to all clients
    io.emit('user-count', userCount);
    
    // Send current canvas state to new user
    if (canvasData) {
      socket.emit('canvas-data', canvasData);
      console.log(`📤 Sent canvas data to ${socket.id}`);
    }

    // ─── DRAW EVENT ─────────
    socket.on('draw', (data) => {
      try {
        // Validate data
        if (!data || typeof data !== 'object') return;
        const { x0, y0, x1, y1, color, size } = data;
        if (x0 === undefined || y0 === undefined || x1 === undefined || y1 === undefined) return;
        
        socket.broadcast.emit('draw', {
          x0, y0, x1, y1,
          color: color || '#000000',
          size: size || 5
        });
      } catch (error) {
        console.error('Error handling draw event:', error);
      }
    });

    // ─── DOT EVENT ─────────
    socket.on('dot', (data) => {
      try {
        if (!data || typeof data !== 'object') return;
        const { x, y, color, size } = data;
        if (x === undefined || y === undefined) return;
        
        socket.broadcast.emit('dot', {
          x, y,
          color: color || '#000000',
          size: size || 5
        });
      } catch (error) {
        console.error('Error handling dot event:', error);
      }
    });

    // ─── LINE EVENT ─────────
    socket.on('draw-line', (data) => {
      try {
        if (!data || typeof data !== 'object') return;
        const { x0, y0, x1, y1, color, size } = data;
        if (x0 === undefined || y0 === undefined || x1 === undefined || y1 === undefined) return;
        
        socket.broadcast.emit('draw-line', {
          x0, y0, x1, y1,
          color: color || '#000000',
          size: size || 5
        });
      } catch (error) {
        console.error('Error handling draw-line event:', error);
      }
    });

    // ─── RECTANGLE EVENT ─────────
    socket.on('draw-rect', (data) => {
      try {
        if (!data || typeof data !== 'object') return;
        const { x, y, w, h, color, size } = data;
        if (x === undefined || y === undefined || w === undefined || h === undefined) return;
        
        socket.broadcast.emit('draw-rect', {
          x, y, w, h,
          color: color || '#000000',
          size: size || 5
        });
      } catch (error) {
        console.error('Error handling draw-rect event:', error);
      }
    });

    // ─── CIRCLE EVENT ─────────
    socket.on('draw-circle', (data) => {
      try {
        if (!data || typeof data !== 'object') return;
        const { x, y, radius, color, size } = data;
        if (x === undefined || y === undefined || radius === undefined) return;
        
        socket.broadcast.emit('draw-circle', {
          x, y, radius,
          color: color || '#000000',
          size: size || 5
        });
      } catch (error) {
        console.error('Error handling draw-circle event:', error);
      }
    });

    // ─── TEXT EVENT ─────────
    socket.on('draw-text', (data) => {
      try {
        if (!data || typeof data !== 'object') return;
        const { x, y, text, color, size } = data;
        if (x === undefined || y === undefined || !text) return;
        
        socket.broadcast.emit('draw-text', {
          x, y, text,
          color: color || '#000000',
          size: size || 5
        });
      } catch (error) {
        console.error('Error handling draw-text event:', error);
      }
    });

    // ─── CLEAR EVENT ─────────
    socket.on('clear', () => {
      canvasData = null;
      io.emit('clear');
      console.log(`🗑️ Board cleared by ${socket.id}`);
    });

    // ─── CANVAS DATA SYNC ─────────
    socket.on('canvas-data', (data) => {
      try {
        if (data && typeof data === 'string' && data.startsWith('data:image')) {
          canvasData = data;
          console.log(`💾 Canvas data saved from ${socket.id}`);
        }
      } catch (error) {
        console.error('Error handling canvas-data event:', error);
      }
    });

    // ─── DRAWING STATUS ─────────
    socket.on('drawing-status', (data) => {
      try {
        const isDrawing = data && typeof data === 'object' ? data.isDrawing : data;
        
        if (isDrawing) {
          drawingUsers.add(socket.id);
        } else {
          drawingUsers.delete(socket.id);
        }
        
        // Broadcast if someone is drawing
        const someoneDrawing = drawingUsers.size > 0;
        io.emit('drawing-status', someoneDrawing);
        
        if (someoneDrawing) {
          console.log(`✏️ ${socket.id} is drawing (${drawingUsers.size} active)`);
        }
      } catch (error) {
        console.error('Error handling drawing-status event:', error);
      }
    });

    // ─── DISCONNECTION ─────────
    socket.on('disconnect', (reason) => {
      userCount = Math.max(0, userCount - 1);
      drawingUsers.delete(socket.id);
      delete connectedUsers[socket.id];
      
      console.log(`🔴 User disconnected: ${socket.id} (${reason})`);
      console.log(`👥 Total users: ${userCount}`);
      
      // Update all clients
      io.emit('user-count', userCount);
      io.emit('drawing-status', drawingUsers.size > 0);
    });

    // ─── ERROR HANDLING ─────────
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });

    // ─── PING/PONG FOR KEEP-ALIVE ─────────
    socket.on('ping', () => {
      socket.emit('pong');
    });

  });

  // ─── GLOBAL ERROR HANDLING ─────────
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
  });

  // ─── START SERVER ─────────
  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  server.listen(PORT, HOST, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📡 WebSocket: ws://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📦 Ready for connections\n`);
  });

  // ─── GRACEFUL SHUTDOWN ─────────
  const gracefulShutdown = (signal) => {
    console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
    
    io.close(() => {
      console.log('🔌 Socket.IO closed');
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Force shutdown');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // ─── SERVER ERROR HANDLING ─────────
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
    }
  });

  // Export for testing
  module.exports = { app, server, io };