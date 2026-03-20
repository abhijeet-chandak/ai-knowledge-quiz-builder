const quizService = require('../services/quizService');
const { asyncHandler } = require('../middleware/errorHandler');

const create = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { topic } = req.body || {};
  const data = await quizService.generateAndPersistQuiz(userId, topic);
  res.status(201).json({ success: true, data });
});

const submit = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const quizId = Number(req.params.quizId);
  if (!Number.isFinite(quizId)) {
    const e = new Error('Invalid quiz id');
    e.code = 'VALIDATION';
    throw e;
  }
  const { answers } = req.body || {};
  const result = await quizService.submitQuiz(userId, quizId, answers);
  res.json({ success: true, data: result });
});

const list = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const rows = await quizService.getHistory(userId);
  const quizzes = rows.map((r) => ({
    quizId: r.id,
    topic: r.topic,
    createdAt: r.created_at,
    score: r.score,
    total: r.total_questions,
    completedAt: r.completed_at,
  }));
  res.json({ success: true, data: { quizzes } });
});

const getById = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const quizId = Number(req.params.quizId);
  if (!Number.isFinite(quizId)) {
    const e = new Error('Invalid quiz id');
    e.code = 'VALIDATION';
    throw e;
  }
  const data = await quizService.getQuizDetail(userId, quizId);
  res.json({ success: true, data });
});

const getQuestions = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const quizId = Number(req.params.quizId);
  if (!Number.isFinite(quizId)) {
    const e = new Error('Invalid quiz id');
    e.code = 'VALIDATION';
    throw e;
  }
  const data = await quizService.getQuizForTaking(userId, quizId);
  res.json({ success: true, data });
});

module.exports = { create, list, getQuestions, submit, getById };
