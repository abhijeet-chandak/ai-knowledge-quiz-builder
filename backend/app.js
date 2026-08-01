require('./config/loadEnv');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');
const { errorHandler } = require('./middleware/errorHandler');
const { pool } = require('./config/db');

// Fail fast on missing/weak secrets instead of erroring on the first request.
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 16) {
  console.error(
    'FATAL: JWT_SECRET must be set in backend/.env (min 16 chars). Example: openssl rand -hex 32'
  );
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.warn(
    'WARN: GEMINI_API_KEY is not set — quiz generation will return 503 until it is configured.'
  );
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.disable('x-powered-by');
// Behind a reverse proxy (nginx, Render, Railway…) set TRUST_PROXY=1 so
// rate limiting sees real client IPs instead of the proxy's.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
}

app.use(helmet());

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : defaultOrigins;

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: '100kb' }));

const rateLimited = (message) => ({
  success: false,
  error: { code: 'RATE_LIMITED', message },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimited('Too many requests. Please try again later.'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimited('Too many sign-in attempts. Please try again in a few minutes.'),
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'quiz-builder-api' });
});

app.get('/api', (req, res) => {
  res.json({
    ok: true,
    service: 'quiz-builder-api',
    hint: 'Use /api/health or the routes under /api/auth and /api/quizzes.',
    endpoints: {
      health: '/api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      createQuiz: 'POST /api/quizzes',
      listQuizzes: 'GET /api/quizzes',
      quizQuestions: 'GET /api/quizzes/:quizId/questions',
      submitQuiz: 'POST /api/quizzes/:quizId/submissions',
      quizDetail: 'GET /api/quizzes/:quizId',
    },
  });
});

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

app.use(errorHandler);

// Only listen when run directly, so the app can be imported (e.g. by tests)
// without opening a port.
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Quiz API listening on http://localhost:${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received — shutting down`);
    server.close(() => {
      pool
        .end()
        .catch(() => {})
        .finally(() => process.exit(0));
    });
    // Force-exit if connections refuse to drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = app;
