const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

// Set default environment variables if not found
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'my_super_secret_key_123';
  console.log('⚠️  Using default JWT_SECRET. Please set JWT_SECRET in .env file for production!');
}

if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb+srv://surekaA:sureka%4008@cluster0.birbfqf.mongodb.net/service-booking-app?retryWrites=true&w=majority';
  console.log('⚠️  Using default MONGODB_URI. Please set MONGODB_URI in .env file!');
}

if (!process.env.PORT) {
  process.env.PORT = '5000';
}

if (!process.env.CLIENT_URL) {
  process.env.CLIENT_URL = 'http://localhost:3000';
}

console.log('🔧 Environment Variables Status:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET');
console.log('PORT:', process.env.PORT);
console.log('CLIENT_URL:', process.env.CLIENT_URL);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const mongoUri = process.env.MONGODB_URI;
console.log('🔗 Connecting to MongoDB...');
console.log('📍 Using URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds timeout
  socketTimeoutMS: 45000, // 45 seconds timeout
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database:', mongoose.connection.name);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('💡 Troubleshooting tips:');
  console.log('   1. Check your internet connection');
  console.log('   2. Verify MongoDB Atlas cluster is running');
  console.log('   3. Check if IP is whitelisted in MongoDB Atlas');
  console.log('   4. Verify connection string in .env file');
  process.exit(1); // Exit if database connection fails
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/announcements', require('./routes/announcements'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ServiceHub Sri Lanka API is running',
    country: 'Sri Lanka',
    service: 'Service Booking Platform'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('🇱🇰 ServiceHub Sri Lanka - Server running on port', PORT);
  console.log('📱 Sri Lankan Service Booking Platform');
  console.log('🔗 API: http://localhost:' + PORT);
});
