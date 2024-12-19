const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../server/swagger.json');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const errorHandler = require('./middlewares/errorHandler');
const redisClient = require('./config/redis');

// Load environment variables
dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Initialize Redis
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Initialize Express app
const app = express();

// Middleware
app.use(express.json()); // Body parser for JSON requests

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', urlRoutes);
app.use('/api', analyticsRoutes);

// Error handling middleware
app.use(errorHandler);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Custom URL Shortener API is running...');
});

module.exports = app;
