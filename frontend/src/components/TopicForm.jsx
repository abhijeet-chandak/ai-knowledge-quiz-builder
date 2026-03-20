import { useState } from 'react';

const examples = ['Photosynthesis', 'Neural Networks', 'Ancient Rome'];

export default function TopicForm({
  onSubmit,
  loading,
  error,
  formClassName = '',
}) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(topic.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={['topic-form', formClassName].filter(Boolean).join(' ')}
    >
      <label htmlFor="topic" className="topic-label">
        What should the quiz be about?
      </label>
      <input
        id="topic"
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. Quantum computing"
        disabled={loading}
        className="topic-input"
        autoComplete="off"
      />
      <p className="topic-hint">
        Try:{' '}
        {examples.map((ex, i) => (
          <span key={ex}>
            {i > 0 ? ' · ' : null}
            <button
              type="button"
              className="linkish"
              onClick={() => setTopic(ex)}
              disabled={loading}
            >
              {ex}
            </button>
          </span>
        ))}
      </p>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn primary" disabled={loading || !topic.trim()}>
        {loading ? 'Generating quiz…' : 'Generate Quiz'}
      </button>
    </form>
  );
}
