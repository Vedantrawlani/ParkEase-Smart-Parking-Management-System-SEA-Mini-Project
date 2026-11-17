const express = require('express');
const cors = require('cors');
const { requestCounter } = require('./middleware/requestCounter');
const { getHealth } = require('./config/database');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const engineeringRoutes = require('./routes/engineeringRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Global Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Instrumentation for System Health Metrics
app.use(requestCounter);

// Root & Health Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'ParkEase API',
    version: '1.0.0',
    description: 'Smart Parking Management System for College Faculty (Software Engineering & Architecture Mini Project)',
    status: 'ONLINE',
    docs: '/api/health'
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = getHealth();
  const uptime = Math.floor(process.uptime());

  res.status(200).json({
    status: dbStatus.connected ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: uptime,
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus
  });
});

// Mount Feature API Routes
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/engineering', engineeringRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[ParkEase Error]', err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;

