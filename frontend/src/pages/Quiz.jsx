import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import QuestionCard from '../components/QuestionCard.jsx';
import { submitQuiz, getQuizForTaking, getErrorMessage } from '../services/api.js';

const STORAGE_PREFIX = 'quiz_session_';

export default function Quiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const id = Number(quizId);

  const [questions, setQuestions] = useState([]);
  const [topic, setTopic] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fromState = location.state?.questions;
    const t = location.state?.topic || '';
    if (fromState?.length) {
      setQuestions(fromState);
      setTopic(t);
      return;
    }
    try {
      const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.questions?.length) {
          setQuestions(parsed.questions);
          setTopic(parsed.topic || '');
          return;
        }
      }
    } catch {
      /* ignore */
    }
    (async () => {
      try {
        const data = await getQuizForTaking(id);
        if (!cancelled && data.questions?.length) {
          setQuestions(data.questions);
          setTopic(data.topic || '');
        }
      } catch (e) {
        if (!cancelled) setLoadError(getErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.state, id]);

  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.questionId]).length,
    [questions, answers]
  );

  const onSelect = (questionId, label) => {
    setAnswers((prev) => ({ ...prev, [questionId]: label }));
  };

  const handleSubmit = async () => {
    setError('');
    const payload = questions.map((q) => ({
      questionId: q.questionId,
      selected: answers[q.questionId] || '',
    }));
    const unanswered = payload.filter((p) => !p.selected).length;
    if (unanswered > 0 && !window.confirm(`${unanswered} unanswered. Submit anyway?`)) return;

    setSubmitting(true);
    try {
      const result = await submitQuiz(id, payload);
      sessionStorage.removeItem(`${STORAGE_PREFIX}${id}`);
      navigate(`/result/${id}`, { state: { result, topic } });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="page quiz-page quiz-page--state">
        <Link to="/" className="quiz-page__back">
          ← Back to home
        </Link>
        <p className="quiz-page__state-msg form-error" role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="page quiz-page quiz-page--state">
        <Link to="/" className="quiz-page__back">
          ← Back to home
        </Link>
        <p className="quiz-page__state-msg muted">Loading quiz…</p>
      </div>
    );
  }

  const total = questions.length;

  return (
    <div className="page quiz-page">
      <header className="quiz-page__header">
        <Link to="/" className="quiz-page__back">
          ← Back to home
        </Link>
        <div className="quiz-page__headline">
          {topic ? (
            <p className="quiz-page__topic" title={topic}>
              {topic}
            </p>
          ) : null}
          <h1 className="quiz-page__title">Quiz</h1>
          <p className="quiz-page__lead">
            All questions are on this page. Select one answer per question, then
            submit.
          </p>
        </div>
      </header>

      <div className="quiz-questions" role="list">
        {questions.map((q, i) => (
          <div key={q.questionId} className="quiz-questions__item" role="listitem">
            <QuestionCard
              domId={`quiz-q-${q.questionId}`}
              index={i}
              total={total}
              showTotalInBadge={false}
              questionId={q.questionId}
              question={q.question}
              options={q.options}
              selected={answers[q.questionId]}
              onSelect={onSelect}
              disabled={submitting}
              className={
                answers[q.questionId] ? 'question-card--answered' : undefined
              }
            />
          </div>
        ))}
      </div>

      <div className="quiz-submit-bar">
        <div className="quiz-submit-bar__inner">
          <div className="quiz-submit-bar__meta" aria-live="polite">
            <span className="quiz-progress">
              <strong>{answeredCount}</strong>
              <span className="quiz-progress__sep"> / </span>
              {total} answered
            </span>
            {answeredCount < total ? (
              <span className="quiz-progress__hint muted">
                You can still submit with gaps.
              </span>
            ) : (
              <span className="quiz-progress__hint quiz-progress__hint--ok">
                Ready to submit
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn primary quiz-submit-bar__btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit quiz'}
          </button>
        </div>
      </div>

      {error && (
        <p className="form-error quiz-page__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
