import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import QuizResultCard from '../components/QuizResultCard.jsx';
import { getQuizDetail, getErrorMessage } from '../services/api.js';

export default function Result() {
  const { quizId } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result || null);
  const [topic, setTopic] = useState(location.state?.topic || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!location.state?.result);

  useEffect(() => {
    if (location.state?.result) {
      setResult(location.state.result);
      setTopic(location.state.topic || '');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getQuizDetail(Number(quizId));
        if (data.score == null) {
          if (!cancelled) {
            setError('This quiz has not been submitted yet.');
            setLoading(false);
          }
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
        if (!cancelled) {
          setResult({ score: data.score, total: data.total, breakdown });
          setTopic(data.quiz?.topic || '');
        }
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quizId, location.state]);

  const pct = useMemo(() => {
    if (!result?.total) return 0;
    return Math.round((result.score / result.total) * 100);
  }, [result]);

  if (loading) {
    return (
      <div className="page result-page result-page--state">
        <Link to="/" className="result-page__back">
          ← Back to home
        </Link>
        <p className="result-page__state-msg muted">Loading results…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page result-page result-page--state">
        <Link to="/" className="result-page__back">
          ← Back to home
        </Link>
        <p className="result-page__state-msg form-error" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!result?.breakdown) {
    return (
      <div className="page result-page result-page--state">
        <Link to="/" className="result-page__back">
          ← Back to home
        </Link>
        <p className="result-page__state-msg muted">No results. Take a quiz first.</p>
      </div>
    );
  }

  const { score, total, breakdown } = result;
  const correctCount = breakdown.filter((b) => b.isCorrect).length;

  let scoreTone = 'result-score-card--mid';
  if (pct >= 80) scoreTone = 'result-score-card--high';
  else if (pct < 50) scoreTone = 'result-score-card--low';

  return (
    <div className="page result-page">
      <Link to="/" className="result-page__back">
        ← Back to home
      </Link>

      <header className="result-page__header">
        {topic ? (
          <p className="result-page__topic" title={topic}>
            {topic}
          </p>
        ) : null}
        <h1 className="result-page__title">Results</h1>
        <p className="result-page__lead">
          Review your score below, then open each question for explanations.
        </p>
      </header>

      <div className={`result-score-card ${scoreTone}`}>
        <p className="result-score-card__eyebrow">Your score</p>
        <p className="result-score-card__value" aria-live="polite">
          <span className="result-score-card__num">{score}</span>
          <span className="result-score-card__slash">/</span>
          <span className="result-score-card__total">{total}</span>
        </p>
        <p className="result-score-card__meta">
          <span className="result-score-card__pct">{pct}%</span>
          <span className="result-score-card__sep">·</span>
          <span>
            {correctCount} correct out of {total}
          </span>
        </p>
      </div>

      <nav className="result-page__actions" aria-label="Next steps">
        <Link to="/" className="btn primary">
          New quiz
        </Link>
        <Link to="/history" className="btn secondary">
          Quiz history
        </Link>
      </nav>

      <section
        className="result-page__review"
        aria-labelledby="result-review-heading"
      >
        <div className="result-page__review-head">
          <h2 id="result-review-heading" className="result-page__review-title">
            Question review
          </h2>
          <p className="result-page__review-desc">
            Your answers compared with the correct option and a short explanation
            for each item.
          </p>
        </div>
        <div className="result-page__cards">
          {breakdown.map((item, i) => (
            <QuizResultCard key={item.questionId} item={item} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
