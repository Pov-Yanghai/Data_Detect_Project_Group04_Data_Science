import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import uploadRoutes from './routes/upload.js';
import analyzeRoutes from './routes/analyze.js';
import cleanRoutes from './routes/clean.js';
import trainRoutes from './routes/train.js';
import graphsRoutes from './routes/graphs.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FRONTEND_URLS = process.env.FRONTEND_URLS || '';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
const normalizeOrigin = (value) => (value || '').trim().replace(/\/$/, '');
const allowedOrigins = [
  ...FRONTEND_URLS.split(',').map(normalizeOrigin).filter(Boolean),
  normalizeOrigin(FRONTEND_URL),
].filter(Boolean);

const isVercelPreview = (origin) => {
  try {
    const host = new URL(origin).hostname;
    return host.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    if (NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }

    // Allow non-browser calls (curl, server-to-server, health checks).
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized) || isVercelPreview(normalized)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Make ML_SERVICE_URL available to routes
app.use((req, res, next) => {
  req.mlServiceUrl = ML_SERVICE_URL;
  next();
});

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/clean', cleanRoutes);
app.use('/api/train', trainRoutes);
app.use('/api/graphs', graphsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'data-processing-api' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[v0] Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`[v0] Data Processing API running on http://localhost:${PORT}`);
  console.log(`[v0] ML Service URL: ${ML_SERVICE_URL}`);
  console.log(`[v0] Frontend URL: ${FRONTEND_URL}`);
  console.log(`[v0] Frontend URL list: ${FRONTEND_URLS || '(not set)'}`);
  console.log(`[v0] Node Environment: ${NODE_ENV}`);
});
