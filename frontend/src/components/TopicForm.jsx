import { useState } from 'react';
import { IconSparkles } from './icons.jsx';

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
      <div className="topic-form__row">
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
        <button
          type="submit"
          className="btn primary topic-submit"
          disabled={loading || !topic.trim()}
        >
          {loading ? <span className="spinner" aria-hidden="true" /> : <IconSparkles />}
          {loading ? 'Generating…' : 'Generate quiz'}
        </button>
      </div>
      <p className="topic-hint">
        <span>Try:</span>
        {examples.map((ex) => (
          <button
            key={ex}
            type="button"
            className="chip"
            onClick={() => setTopic(ex)}
            disabled={loading}
          >
            {ex}
          </button>
        ))}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
