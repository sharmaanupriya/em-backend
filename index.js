const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app); // ✅ Create server for WebSockets

const io = socketIo(server, {
  cors: {
    // origin: ["http://localhost:3000", "http://localhost:3001"], // ✅ Allow both origins
    origin: 'https://events-management-site.netlify.app', 
    methods: ["GET", "POST"],
    credentials: true, // ✅ Allow cookies/auth headers
  },
});


const port = process.env.PORT || 5001;

// Middleware
app.use(express.json());

// ✅ Proper CORS Configuration
// const allowedOrigins = ['http://localhost:3001']; // Ensure it's HTTP, not HTTPS
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error('Not allowed by CORS'));
//       }
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true, // ✅ Allow cookies/auth headers
//   })
// );

// const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001']; // ✅ Add frontend URLs
const allowedOrigins = ['https://events-management-site.netlify.app'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // ✅ Allow cookies/auth headers
  })
);

app.options('*', cors()); // ✅ Ensure OPTIONS requests are handled

// Import Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Backend is running Successfully');
});

// Catch-all route for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

let eventAttendees = {}; // Store unique socket connections per event

io.on("connection", (socket) => {
  console.log(`🔵 New client connected: ${socket.id}`);

  // ✅ Handle User Joining Event
  socket.on("join_event", (eventId) => {
    if (!eventAttendees[eventId]) {
      eventAttendees[eventId] = new Set(); // Track unique sockets
    }
    eventAttendees[eventId].add(socket.id); // Add user socket

    // ✅ Send accurate attendee count
    io.emit("update_attendees", { eventId, count: eventAttendees[eventId].size });
  });

  // ✅ Handle User Leaving Event
  socket.on("leave_event", (eventId) => {
    if (eventAttendees[eventId]) {
      eventAttendees[eventId].delete(socket.id); // Remove user socket
      io.emit("update_attendees", { eventId, count: eventAttendees[eventId].size });
    }
  });

  // ✅ Handle Disconnection (Remove Attendees)
  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
    
    for (const eventId in eventAttendees) {
      if (eventAttendees[eventId].has(socket.id)) {
        eventAttendees[eventId].delete(socket.id);
        io.emit("update_attendees", { eventId, count: eventAttendees[eventId].size });
      }
    }
  });
});

// ✅ Connect to MongoDB with Retry Mechanism
const connectWithRetry = () => {
  mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err);
      console.log('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000); // Retry connection after 5 seconds
    });
};

connectWithRetry(); // ✅ Start MongoDB connection

// ✅ Start Server Using `server.listen()` (NOT `app.listen()`)
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
