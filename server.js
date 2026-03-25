const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { syncDB, Message } = require('./models');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const matchRoutes = require('./routes/matchRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST']
  }
});

// Make io accessible in controllers
app.set('io', io);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

const rateLimit = require('express-rate-limit');
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(globalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/logs', logRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('StudyMatch API is running...');
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);
  
  // Join a study session chat room
  socket.on('join_room', (sessionId) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined room: ${sessionId}`);
  });

  // Handle messages
  socket.on('send_message', async (data) => {
    try {
      // data: { session_id, user_id, content, userName }
      const message = await Message.create({
        session_id: data.session_id,
        user_id: data.user_id,
        content: data.content
      });

      // Broadcast to room
      io.to(data.session_id).emit('receive_message', {
        id: message.id,
        session_id: data.session_id,
        user_id: data.user_id,
        userName: data.userName,
        content: data.content,
        createdAt: message.createdAt
      });
    } catch (err) {
      console.error('Socket message error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from socket:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await syncDB();

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`   Run this command to free it: lsof -ti :${PORT} | xargs kill -9\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer();
