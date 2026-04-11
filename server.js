const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const { connectDB } = require("./config/db");
const { syncDB, Message } = require("./models");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const matchRoutes = require("./routes/matchRoutes");
const logRoutes = require("./routes/logRoutes");

const app = express();
const server = http.createServer(app);

// Middleware & Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];
// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// app.options("/*", cors());

// Make io accessible in controllers
app.set("io", io);

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("Blocked by CORS:", origin);
        console.warn({allowedOrigins});
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json());

const rateLimit = require("express-rate-limit");
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: {
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(globalLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/logs", logRoutes);

// Basic Route
app.get("/", (req, res) => {
  res.send("StudyMatch API is running...");
});

// Socket.io connection handling
// In-memory store for active users in rooms
// { roomId: { socketId: { id, name } } }
const roomUsers = {};

io.on("connection", (socket) => {
  console.log("User connected to socket:", socket.id);

  socket.on("join_room", (data) => {
    const rawId = typeof data === "string" ? data : data.sessionId;
    const sessionId = String(rawId);
    const user = data.user;

    socket.join(sessionId);

    if (user) {
      if (!roomUsers[sessionId]) roomUsers[sessionId] = {};
      roomUsers[sessionId][socket.id] = { id: user.id, name: user.name };

      const users = Object.values(roomUsers[sessionId]);
      console.log(`User list updated for room ${sessionId}:`, users);
      io.to(sessionId).emit("update_user_list", users);
    }

    console.log(`User ${user?.name || socket.id} joined room: ${sessionId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const sessionId = String(data.session_id);
      console.log(`Message received for room ${sessionId}:`, data.content);

      const message = await Message.create({
        session_id: data.session_id,
        user_id: data.user_id,
        content: data.content,
      });

      const broadcastData = {
        id: message.id,
        session_id: data.session_id,
        user_id: data.user_id,
        userName: data.userName,
        content: data.content,
        createdAt: message.createdAt,
      };

      io.to(sessionId).emit("receive_message", broadcastData);
      console.log(`Broadcasted message to room ${sessionId}`);
    } catch (err) {
      console.error("Socket message error:", err);
    }
  });

  socket.on("disconnect", () => {
    for (const sessionId in roomUsers) {
      if (roomUsers[sessionId][socket.id]) {
        const userName = roomUsers[sessionId][socket.id].name;
        delete roomUsers[sessionId][socket.id];
        
        if (Object.keys(roomUsers[sessionId]).length === 0) {
          delete roomUsers[sessionId];
        } else {
          io.to(sessionId).emit("update_user_list", Object.values(roomUsers[sessionId]));
        }
        console.log(`User ${userName} disconnected from room ${sessionId}`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await syncDB();

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(
        `   Run this command to free it: lsof -ti :${PORT} | xargs kill -9\n`,
      );
      process.exit(1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });
};

startServer();
