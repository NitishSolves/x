import http from 'node:http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

import db, { isPostgres } from './config/db.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';

import authRoutes from './routes/authRoutes.js';
import collegeRoutes from './routes/collegeRoutes.js';
import busRoutes from './routes/busRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import stopRoutes from './routes/stopRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

import { setupSocketIO } from './sockets/socketHandler.js';
import { setSocketIO } from './controllers/tripController.js';
import { setAlertSocketIO } from './controllers/alertController.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '5mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'CampusMove',
    version: '1.0.0',
    database: isPostgres ? 'PostgreSQL (Neon/Cloud)' : 'Native SQLite Engine',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Configure Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

// Wire Socket.IO into controllers and listeners
setSocketIO(io);
setAlertSocketIO(io);
setupSocketIO(io);

// Server Startup
async function startServer() {
  try {
    // Run migrations and seed check
    await runMigrations();
    await seedDatabase();

    httpServer.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 CampusMove Backend Running on port ${PORT}`);
      console.log(`📡 Real-Time Telemetry Gateway: Active (Socket.IO)`);
      console.log(`💾 Database: ${isPostgres ? 'PostgreSQL on Neon' : 'Built-in Native SQLite Engine'}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('[Fatal Startup Error]:', err);
    process.exit(1);
  }
}

startServer();

export { app, httpServer, io };
