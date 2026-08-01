import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import QuizResultCard from '../components/QuizResultCard.jsx';
import { getQuizDetail, getErrorMessage } from '../services/api.js';
import { IconArrowLeft } from '../components/icons.jsx';

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
      <div className="page result-page">
        <div className="page-loader">
          <span className="spinner spinner--dark spinner--lg" aria-hidden="true" />
          Loading results…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page result-page result-page--state">
        <Link to="/" className="back-link">
          <IconArrowLeft />
          Back to home
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
        <Link to="/" className="back-link">
          <IconArrowLeft />
          Back to home
        </Link>
        <p className="result-page__state-msg muted">No results. Take a quiz first.</p>
      </div>
    );
  }

  const { score, total, breakdown } = result;
  const correctCount = breakdown.filter((b) => b.isCorrect).length;
  const wrongCount = total - correctCount;

  let scoreTone = '';
  if (pct >= 80) scoreTone = 'result-summary--high';
  else if (pct < 50) scoreTone = 'result-summary--low';

  // SVG ring geometry: r=54 in a 120×120 viewBox
  const RING_C = 2 * Math.PI * 54;
  const ringOffset = RING_C * (1 - pct / 100);

  return (
    <div className="page result-page">
      <Link to="/" className="back-link">
        <IconArrowLeft />
        Back to home
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

      <div className={`result-summary ${scoreTone}`} aria-live="polite">
        <div className="score-ring" role="img" aria-label={`Score ${score} out of ${total} (${pct}%)`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="score-ring__track" cx="60" cy="60" r="54" />
            <circle
              className="score-ring__fill"
              cx="60"
              cy="60"
              r="54"
              strokeDasharray={RING_C}
              strokeDashoffset={ringOffset}
            />
          </svg>
          <div className="score-ring__center">
            <span className="score-ring__pct">{pct}%</span>
            <span className="score-ring__label">
              {score}/{total}
            </span>
          </div>
        </div>
        <div className="result-stats">
          <p className="result-stat">
            <span className="result-stat__dot result-stat__dot--correct" />
            <strong>{correctCount}</strong>&nbsp;correct
          </p>
          <p className="result-stat">
            <span className="result-stat__dot result-stat__dot--wrong" />
            <strong>{wrongCount}</strong>&nbsp;incorrect
          </p>
          <p className="result-stat">
            <span className="result-stat__dot result-stat__dot--total" />
            <strong>{total}</strong>&nbsp;questions total
          </p>
        </div>
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
