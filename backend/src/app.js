const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const { globalLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes            = require('./routes/auth');
const animeRoutes           = require('./routes/anime');
const episodeRoutes         = require('./routes/episodes');
const watchHistoryRoutes    = require('./routes/watchHistory');
const adminRoutes           = require('./routes/admin');
const recommendationRoutes  = require('./routes/recommendations');
const genreRoutes           = require('./routes/genres');

const app = express();

// ── Security & Logging ──────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ────────────────────────────────────────────
app.use(globalLimiter);

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/anime',           animeRoutes);
app.use('/api/episodes',        episodeRoutes);
app.use('/api/watch-history',   watchHistoryRoutes);
app.use('/api/admin',           adminRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/genres',          genreRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global Error Handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
