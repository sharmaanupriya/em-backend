const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: 'https://events-management-site.netlify.app', // Allow frontend origin
    methods: ['GET', 'POST'],
  },
});

const port = process.env.PORT || 5001;

// Middleware
app.use(express.json()); // Parse JSON request bodies

// Proper CORS Configuration
const allowedOrigins = ['https://events-management-site.netlify.app'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Ensure OPTIONS requests are handled
app.options('*', cors());

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

// Socket.IO Connection for real-time updates
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Handle disconnect event
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
  
  // Add more events to listen to as needed
});

// Connect to MongoDB without deprecated options
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.log('Failed to connect to MongoDB', err);
    process.exit(1); // Exit the process if DB connection fails
  });

// Start the server using the HTTP server (not express app directly)
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
