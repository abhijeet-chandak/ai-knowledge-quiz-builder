import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getQuizHistory, getQuizDetail, getErrorMessage } from '../services/api.js';

export default function QuizHistory() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getQuizHistory();
        if (!cancelled) setQuizzes(list);
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openReview = async (quizId) => {
    try {
      const data = await getQuizDetail(quizId);
      if (data.score == null) {
        navigate(`/quiz/${quizId}`);
        return;
      }
      const breakdown = data.questions.map((q) => ({
        questionId: q.questionId,
        question: q.question,
        options: q.options,
        userAnswer: q.userAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect: q.isCorrect,
      }));
      navigate(`/result/${quizId}`, {
        state: {
          result: { score: data.score, total: data.total, breakdown },
          topic: data.quiz.topic,
        },
      });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <div className="page history-page">
      <header className="page-header">
        <Link to="/" className="back-link">
          ← Home
        </Link>
        <h1 className="title">Quiz history</h1>
        <p className="subtitle">Past topics, scores, and reviews.</p>
      </header>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !quizzes.length && (
        <p className="muted">No quizzes yet. Generate one from home.</p>
      )}

      <ul className="history-list">
        {quizzes.map((q) => (
          <li key={q.quizId} className="history-row">
            <div className="history-main">
              <strong className="history-topic">{q.topic}</strong>
              <span className="muted mono history-date">
                {new Date(q.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="history-side">
              {q.score != null ? (
                <span className="score-pill mono">
                  {q.score}/{q.total}
                </span>
              ) : (
                <span className="tag warn">In progress</span>
              )}
              <button
                type="button"
                className="btn secondary small"
                onClick={() => openReview(q.quizId)}
              >
                {q.score != null ? 'Review' : 'Continue'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
