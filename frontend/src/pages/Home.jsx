import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import TopicForm from '../components/TopicForm.jsx';
import { generateQuiz, getQuizHistory, getErrorMessage } from '../services/api.js';
import { IconBook, IconTarget, IconTrophy } from '../components/icons.jsx';

const STORAGE_PREFIX = 'quiz_session_';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  // Header stat cards, derived from the same history endpoint the History
  // page uses. Purely informational — errors just leave the placeholders.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getQuizHistory();
        if (cancelled) return;
        const completed = list.filter((q) => q.score != null);
        const avg = completed.length
          ? Math.round(
              (completed.reduce((s, q) => s + q.score / q.total, 0) /
                completed.length) *
                100
            )
          : null;
        setStats({ total: list.length, completed: completed.length, avg });
      } catch {
        /* stat cards are optional — never block quiz generation on them */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerate = async (topic) => {
    setError('');
    setLoading(true);
    try {
      const data = await generateQuiz(topic);
      sessionStorage.setItem(
        `${STORAGE_PREFIX}${data.quizId}`,
        JSON.stringify({ questions: data.questions, topic: data.topic })
      );
      navigate(`/quiz/${data.quizId}`, {
        state: { questions: data.questions, topic: data.topic },
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const rawFirst = user?.name?.trim()?.split(/\s+/)?.[0];
  const firstName = rawFirst || 'there';

  return (
    <div className="page home-page">
      <header className="page-head">
        <h1 className="page-head__title">
          Welcome back, <span className="grad">{firstName}</span>
        </h1>
        <p className="page-head__sub">
          Generate a quiz on any topic and track your progress over time.
        </p>
      </header>

      <section className="stats-row" aria-label="Your stats">
        <div className="stat-card">
          <span className="stat-card__icon stat-card__icon--indigo">
            <IconBook />
          </span>
          <div>
            <span className="stat-card__label">Quizzes created</span>
            <span className="stat-card__value">{stats ? stats.total : '—'}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card__icon stat-card__icon--green">
            <IconTarget />
          </span>
          <div>
            <span className="stat-card__label">Completed</span>
            <span className="stat-card__value">
              {stats ? stats.completed : '—'}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-card__icon stat-card__icon--amber">
            <IconTrophy />
          </span>
          <div>
            <span className="stat-card__label">Average score</span>
            <span className="stat-card__value">
              {stats?.avg != null ? `${stats.avg}%` : '—'}
            </span>
          </div>
        </div>
      </section>

      <section className="home-panel" aria-labelledby="home-panel-title">
        <div className="home-panel__head">
          <h2 id="home-panel-title" className="home-panel__title">
            Start a new quiz
          </h2>
          <p className="home-panel__desc">
            Enter a subject, concept, or place — you’ll get 5 multiple-choice
            questions with instant grading and explanations.
          </p>
        </div>
        <TopicForm onSubmit={handleGenerate} loading={loading} error={error} />
      </section>
    </div>
  );
}
