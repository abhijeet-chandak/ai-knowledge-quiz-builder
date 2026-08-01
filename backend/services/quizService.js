const aiService = require('./aiService');
const questionModel = require('../models/questionModel');
const quizModel = require('../models/quizModel');
const wikipediaService = require('./wikipediaService');

const EXPECTED_QUESTION_COUNT = 5;
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const MAX_TOPIC_LENGTH = 300;

function assertQuizAccess(quiz, userId) {
  if (!quiz) {
    const e = new Error('Quiz not found');
    e.code = 'NOT_FOUND';
    throw e;
  }
  if (quiz.user_id !== userId) {
    const e = new Error('Forbidden');
    e.code = 'FORBIDDEN';
    throw e;
  }
}

async function loadOwnedQuiz(quizId, userId) {
  const quiz = await quizModel.findById(quizId);
  assertQuizAccess(quiz, userId);
  return quiz;
}

function answersToMap(answers) {
  const map = {};
  for (const a of answers || []) {
    if (a?.questionId == null || !a?.selected) continue;
    map[Number(a.questionId)] = String(a.selected).toUpperCase().slice(0, 1);
  }
  return map;
}

function selectedForStorage(letter) {
  return letter && OPTION_LETTERS.includes(letter) ? letter : '-';
}

async function generateAndPersistQuiz(userId, topic) {
  const cleanTopic = String(topic || '').trim();
  if (!cleanTopic) {
    const e = new Error('Topic is required');
    e.code = 'VALIDATION';
    throw e;
  }
  if (cleanTopic.length > MAX_TOPIC_LENGTH) {
    const e = new Error(`Topic must be at most ${MAX_TOPIC_LENGTH} characters`);
    e.code = 'VALIDATION';
    throw e;
  }

  const wiki = await wikipediaService.fetchContext(cleanTopic);
  const contextBlock = wiki.extract ? `Title: ${wiki.title}\n${wiki.extract}` : '';

  const { questions } = await aiService.generateQuiz(cleanTopic, contextBlock);

  const quizId = await quizModel.createQuiz({
    userId,
    topic: cleanTopic,
    wikipediaContext: wiki.extract?.slice(0, 2000) || null,
  });

  const stored = await questionModel.bulkInsertQuestions(quizId, questions);

  return {
    quizId,
    topic: cleanTopic,
    wikipedia: {
      title: wiki.title,
      sourceUrl: wiki.sourceUrl,
      degraded: !!wiki.degraded,
    },
    questions: stored.map((s) => ({
      questionId: s.questionId,
      question: s.question,
      options: s.options,
    })),
  };
}

async function submitQuiz(userId, quizId, answers) {
  await loadOwnedQuiz(quizId, userId);

  const questions = await questionModel.findByQuizId(quizId, true);
  if (questions.length !== EXPECTED_QUESTION_COUNT) {
    const e = new Error('Quiz data incomplete');
    e.code = 'DATA_ERROR';
    throw e;
  }

  const answerMap = answersToMap(answers);
  let score = 0;
  const answerRows = [];

  for (const q of questions) {
    const selected = answerMap[q.id] || '';
    if (selected === q.correct) score += 1;
    answerRows.push({
      questionId: q.id,
      selectedOption: selectedForStorage(selected),
    });
  }

  await quizModel.saveSubmission({
    userId,
    quizId,
    score,
    totalQuestions: questions.length,
    answers: answerRows,
  });

  const breakdown = questions.map((q) => ({
    questionId: q.id,
    question: q.question,
    options: q.options,
    userAnswer: answerMap[q.id] || null,
    correctAnswer: q.correct,
    explanation: q.explanation,
    isCorrect: answerMap[q.id] === q.correct,
  }));

  return {
    score,
    total: questions.length,
    breakdown,
  };
}

async function getQuizForTaking(userId, quizId) {
  const quiz = await loadOwnedQuiz(quizId, userId);
  const rows = await questionModel.findByQuizId(quizId, false);
  return {
    quizId,
    topic: quiz.topic,
    questions: rows.map((r) => ({
      questionId: r.id,
      question: r.question,
      options: r.options,
    })),
  };
}

async function getHistory(userId) {
  return quizModel.listHistoryForUser(userId);
}

async function getQuizDetail(userId, quizId) {
  const quiz = await loadOwnedQuiz(quizId, userId);

  const resultRow = await quizModel.findResultForQuiz(userId, quizId);
  // Correct answers and explanations are only revealed once the quiz has been
  // submitted — otherwise this endpoint would be a cheat sheet.
  const submitted = !!resultRow;

  const questions = await questionModel.findByQuizId(quizId, submitted);
  const userAnswers = await quizModel.getUserAnswersForQuiz(userId, quizId);
  const ansByQ = Object.fromEntries(
    userAnswers.map((ua) => [ua.question_id, ua.selected_option])
  );

  return {
    quiz: {
      id: quiz.id,
      topic: quiz.topic,
      createdAt: quiz.created_at,
    },
    score: resultRow?.score ?? null,
    total: resultRow?.total_questions ?? null,
    completedAt: resultRow?.created_at ?? null,
    questions: questions.map((q) => {
      const base = {
        questionId: q.id,
        question: q.question,
        options: q.options,
        userAnswer: ansByQ[q.id] ?? null,
      };
      if (submitted) {
        base.correctAnswer = q.correct;
        base.explanation = q.explanation;
        base.isCorrect = ansByQ[q.id] === q.correct;
      }
      return base;
    }),
  };
}

module.exports = {
  generateAndPersistQuiz,
  getHistory,
  getQuizDetail,
  getQuizForTaking,
  submitQuiz,
};
