const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS origins for Express and Socket.IO
const getOrigins = () => {
  if (!process.env.CLIENT_URL) {
    return ["http://localhost:5173", "http://localhost:3000", "http://localhost:5002"];
  }
  if (process.env.CLIENT_URL === '*') return '*';
  return process.env.CLIENT_URL.split(',').map(url => url.trim());
};

const allowedOrigins = getOrigins();

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins === '*' ? '*' : (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // Allow during development/deployment flexibility
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible to our routes
app.set('socketio', io);

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ message: 'ParkNest API Server is running', status: 'OK', timestamp: new Date() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', dbState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED' });
});

// Routes
app.use('/api/parking', require('./routes/parkingRoutes'));
app.use('/api/sensors', require('./routes/sensorRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Start sensor monitor
const sensorMonitor = require('./services/sensorMonitor');
sensorMonitor.start(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
