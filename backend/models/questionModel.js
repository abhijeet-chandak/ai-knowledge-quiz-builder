const { query, transaction } = require('../config/db');

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function normalizeOptions(options) {
  const o = {};
  for (const label of OPTION_LABELS) {
    o[label] = options[label] ?? options[label.toLowerCase()] ?? '';
  }
  return o;
}

async function bulkInsertQuestions(quizId, items) {
  return transaction(async (conn) => {
    const out = [];
    for (const item of items) {
      const opts = normalizeOptions(item.options);
      const correct = String(item.correct || '').toUpperCase().slice(0, 1);
      const [qRes] = await conn.execute(
        'INSERT INTO questions (quiz_id, question_text, correct_option, explanation) VALUES (?, ?, ?, ?)',
        [quizId, item.question, correct, item.explanation || '']
      );
      const questionId = qRes.insertId;
      for (const label of OPTION_LABELS) {
        await conn.execute(
          'INSERT INTO options (question_id, option_label, option_text) VALUES (?, ?, ?)',
          [questionId, label, opts[label]]
        );
      }
      out.push({
        questionId,
        question: item.question,
        options: { ...opts },
      });
    }
    return out;
  });
}

async function findByQuizId(quizId, includeCorrect = false) {
  const questions = await query(
    'SELECT id, quiz_id, question_text, correct_option, explanation FROM questions WHERE quiz_id = ? ORDER BY id',
    [quizId]
  );
  const questionIds = questions.map((q) => q.id);
  if (questionIds.length === 0) return [];

  const placeholders = questionIds.map(() => '?').join(',');
  const rows = await query(
    `SELECT question_id, option_label, option_text FROM options WHERE question_id IN (${placeholders}) ORDER BY question_id, option_label`,
    questionIds
  );

  const optionsByQuestionId = {};
  for (const row of rows) {
    if (!optionsByQuestionId[row.question_id]) {
      optionsByQuestionId[row.question_id] = {};
    }
    optionsByQuestionId[row.question_id][row.option_label] = row.option_text;
  }

  return questions.map((q) => {
    const base = {
      id: q.id,
      question: q.question_text,
      options: optionsByQuestionId[q.id] || {},
    };
    if (includeCorrect) {
      base.correct = q.correct_option;
      base.explanation = q.explanation;
    }
    return base;
  });
}

module.exports = { bulkInsertQuestions, findByQuizId };
