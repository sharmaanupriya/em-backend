const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');  // For creating the HTTP server
const socketIo = require('socket.io'); // For real-time communication

dotenv.config();

const app = express();
const server = http.createServer(app);  // Create server using express app
const io = require('socket.io')(server, {
    cors: {
      origin: 'http://localhost:3000', // Allow frontend origin
      methods: ['GET', 'POST'],
    },
  });
const port = process.env.PORT || 5001;

// Middleware
app.use(express.json()); // Parse JSON request bodies

// Specific CORS configuration to allow only your frontend's origin
app.use(cors({ origin: 'http://localhost:3000' }));

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
  console.log('a user connected');
  
  // Handle disconnect event
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  
  // Add more events to listen to as needed
});

// Connect to MongoDB without deprecated options
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.log('Failed to connect to MongoDB', err);
    process.exit(1); // Exit the process if DB connection fails
  });

// Start the server using the HTTP server (not express app directly)
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
