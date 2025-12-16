const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/config');
const logger = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const JobScheduler = require('./jobs/scheduler');

// Import routes
const contentRoutes = require('./routes/content.routes');
const trendsRoutes = require('./routes/trends.routes');
const scriptRoutes = require('./routes/script.routes');
const jobsRoutes = require('./routes/jobs.routes');

// Create Express app
const app = express();

// Initialize job scheduler
const scheduler = new JobScheduler();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env
  });
});

// API routes
app.use('/api/content', contentRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/script', scriptRoutes);
app.use('/api/jobs', jobsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Social Media Automation API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      content: '/api/content',
      trends: '/api/trends',
      script: '/api/script',
      jobs: '/api/jobs'
    },
    documentation: 'See README.md for API documentation'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Store scheduler instance in app
app.set('scheduler', scheduler);

// Start server
const PORT = config.server.port;

const server = app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: config.server.env,
    nodeVersion: process.version
  });

  // Start scheduled jobs
  scheduler.startAll();
  logger.info('Scheduled jobs initialized');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  
  scheduler.stopAll();
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  
  scheduler.stopAll();
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise
  });
});

module.exports = app;
