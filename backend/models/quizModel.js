const { query, transaction } = require('../config/db');

async function createQuiz({ userId, topic, wikipediaContext }) {
  const result = await query(
    'INSERT INTO quizzes (user_id, topic, wikipedia_context) VALUES (?, ?, ?)',
    [userId, topic, wikipediaContext ?? null]
  );
  return result.insertId;
}

async function findById(quizId) {
  const rows = await query(
    'SELECT id, user_id, topic, created_at FROM quizzes WHERE id = ?',
    [quizId]
  );
  return rows[0] || null;
}

async function listHistoryForUser(userId, limit = 100) {
  // LIMIT can't be a bound param in mysql2 prepared statements on all MySQL
  // versions — sanitize to an integer and inline it.
  const safeLimit = Math.min(500, Math.max(1, Number.parseInt(limit, 10) || 100));
  return query(
    `SELECT q.id, q.topic, q.created_at,
            r.score, r.total_questions, r.created_at AS completed_at
     FROM quizzes q
     LEFT JOIN quiz_results r ON r.quiz_id = q.id AND r.user_id = ?
     WHERE q.user_id = ?
     ORDER BY q.created_at DESC
     LIMIT ${safeLimit}`,
    [userId, userId]
  );
}

/**
 * Persists all answers plus the result row atomically — either the whole
 * submission lands or none of it does.
 */
async function saveSubmission({ userId, quizId, score, totalQuestions, answers }) {
  await transaction(async (conn) => {
    for (const a of answers) {
      await conn.execute(
        `INSERT INTO user_answers (user_id, question_id, selected_option)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE selected_option = VALUES(selected_option), created_at = CURRENT_TIMESTAMP`,
        [userId, a.questionId, a.selectedOption]
      );
    }
    await conn.execute(
      `INSERT INTO quiz_results (user_id, quiz_id, score, total_questions)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE score = VALUES(score), total_questions = VALUES(total_questions), created_at = CURRENT_TIMESTAMP`,
      [userId, quizId, score, totalQuestions]
    );
  });
}

async function getUserAnswersForQuiz(userId, quizId) {
  return query(
    `SELECT ua.question_id, ua.selected_option
     FROM user_answers ua
     INNER JOIN questions q ON q.id = ua.question_id
     WHERE ua.user_id = ? AND q.quiz_id = ?`,
    [userId, quizId]
  );
}

async function findResultForQuiz(userId, quizId) {
  const rows = await query(
    `SELECT score, total_questions, created_at FROM quiz_results
     WHERE user_id = ? AND quiz_id = ? LIMIT 1`,
    [userId, quizId]
  );
  return rows[0] || null;
}

module.exports = {
  createQuiz,
  findById,
  findResultForQuiz,
  getUserAnswersForQuiz,
  listHistoryForUser,
  saveSubmission,
};
