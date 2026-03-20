require('./config/loadEnv');

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

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

app.listen(PORT, () => {
  console.log(`Quiz API listening on http://localhost:${PORT}`);
});

module.exports = app;
