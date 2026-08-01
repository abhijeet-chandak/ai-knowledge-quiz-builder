import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getQuizHistory, getErrorMessage } from '../services/api.js';
import { IconBook, IconSearch, IconSparkles } from '../components/icons.jsx';

export default function QuizHistory() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter((row) => row.topic.toLowerCase().includes(q));
  }, [quizzes, query]);

  // The list already tells us whether the quiz was submitted — the Result
  // page fetches its own detail, so no extra API call is needed here.
  const openReview = (quiz) => {
    navigate(quiz.score != null ? `/result/${quiz.quizId}` : `/quiz/${quiz.quizId}`);
  };

  const pctOf = (q) =>
    q.score != null && q.total ? Math.round((q.score / q.total) * 100) : null;

  return (
    <div className="page history-page">
      <header className="page-head">
        <h1 className="page-head__title">Quiz history</h1>
        <p className="page-head__sub">Past topics, scores, and reviews.</p>
      </header>

      {loading && (
        <div className="page-loader">
          <span className="spinner spinner--dark spinner--lg" aria-hidden="true" />
          Loading history…
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && !quizzes.length && (
        <div className="empty-state">
          <div className="empty-state__icon">
            <IconSparkles />
          </div>
          <h2 className="empty-state__title">No quizzes yet</h2>
          <p className="empty-state__desc">
            Generate your first quiz and it will show up here with your score.
          </p>
          <Link to="/" className="btn primary">
            Create a quiz
          </Link>
        </div>
      )}

      {!loading && !error && quizzes.length > 0 && (
        <>
          <div className="toolbar">
            <div className="search-box">
              <IconSearch />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics…"
                aria-label="Search quiz topics"
              />
            </div>
            <span className="toolbar__count">
              {filtered.length} of {quizzes.length}
            </span>
          </div>

          <div className="table" role="table" aria-label="Quiz history">
            <div className="table__head" role="row">
              <span role="columnheader">Topic</span>
              <span role="columnheader">Created</span>
              <span role="columnheader">Score</span>
              <span role="columnheader">Status</span>
              <span role="columnheader" className="visually-hidden">
                Actions
              </span>
            </div>

            {filtered.map((q) => {
              const pct = pctOf(q);
              return (
                <div key={q.quizId} className="table__row" role="row">
                  <div className="table__topic" role="cell">
                    <span className="history-icon" aria-hidden="true">
                      <IconBook />
                    </span>
                    <span className="history-topic" title={q.topic}>
                      {q.topic}
                    </span>
                  </div>
                  <span className="table__date mono" role="cell">
                    {new Date(q.createdAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="table__score" role="cell">
                    {q.score != null ? (
                      <span className="score-pill mono">
                        {q.score}/{q.total}
                        {pct != null && (
                          <span className="score-pill__pct"> · {pct}%</span>
                        )}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </span>
                  <span role="cell">
                    {q.score != null ? (
                      <span className="tag success">Completed</span>
                    ) : (
                      <span className="tag warn">In progress</span>
                    )}
                  </span>
                  <span className="table__action" role="cell">
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={() => openReview(q)}
                    >
                      {q.score != null ? 'Review' : 'Continue'}
                    </button>
                  </span>
                </div>
              );
            })}

            {!filtered.length && (
              <p className="table__empty muted">
                No topics match “{query.trim()}”.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
