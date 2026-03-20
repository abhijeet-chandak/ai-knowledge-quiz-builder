const LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionCard({
  index,
  total,
  questionId,
  question,
  options,
  selected,
  onSelect,
  disabled,
  /** When false, badge shows only “Question N” (e.g. all questions on one page). */
  showTotalInBadge = true,
  /** Anchor id for scroll / in-page links */
  domId,
  className = '',
}) {
  const badge = showTotalInBadge
    ? `Question ${index + 1} / ${total}`
    : `Question ${index + 1}`;

  return (
    <article
      id={domId}
      className={['question-card', className].filter(Boolean).join(' ')}
    >
      <header className="question-card__head">
        <span className="badge">{badge}</span>
      </header>
      <h2 className="question-text">{question}</h2>
      <ul className="options-list">
        {LABELS.map((label) => {
          const text = options?.[label] ?? '';
          const id = `q-${questionId}-${label}`;
          return (
            <li key={label}>
              <label className={`option-row ${selected === label ? 'selected' : ''}`} htmlFor={id}>
                <input
                  type="radio"
                  id={id}
                  name={`question-${questionId}`}
                  value={label}
                  checked={selected === label}
                  onChange={() => onSelect(questionId, label)}
                  disabled={disabled}
                />
                <span className="option-label mono">{label}</span>
                <span className="option-text">{text}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
