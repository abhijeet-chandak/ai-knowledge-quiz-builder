import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import TopicForm from '../components/TopicForm.jsx';
import { generateQuiz, getErrorMessage } from '../services/api.js';

const STORAGE_PREFIX = 'quiz_session_';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      <section className="home-hero" aria-labelledby="home-welcome">
        <p className="home-hero__eyebrow">Welcome back</p>
        <h1 id="home-welcome" className="home-hero__title">
          Hi, {firstName}
        </h1>
        <p className="home-hero__lead">
          Choose any topic you’re curious about we’ll build a quiz so you can
          check what you know and learn from clear explanations.
        </p>
      </section>

      <section
        className="home-panel"
        aria-labelledby="home-panel-title"
      >
        <div className="home-panel__head">
          <h2 id="home-panel-title" className="home-panel__title">
            Start a new quiz
          </h2>
          <p className="home-panel__desc">
            Enter a subject, concept, or place. You’ll get several
            multiple-choice questions with instant feedback.
          </p>
        </div>
        <TopicForm
          onSubmit={handleGenerate}
          loading={loading}
          error={error}
          formClassName="home-topic-form"
        />
      </section>
    </div>
  );
}
