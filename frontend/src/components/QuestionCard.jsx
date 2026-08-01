import { IconCheck } from './icons.jsx';

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
        {selected && (
          <span className="q-answered">
            <IconCheck />
            Answered
          </span>
        )}
      </header>
      <h2 className="question-text">{question}</h2>
      <ul className="options-list">
        {LABELS.map((label) => {
          const text = options?.[label] ?? '';
          const id = `q-${questionId}-${label}`;
          const isSelected = selected === label;
          return (
            <li key={label}>
              <label
                className={`option-row ${isSelected ? 'selected' : ''}`}
                htmlFor={id}
              >
                <input
                  type="radio"
                  id={id}
                  className="visually-hidden"
                  name={`question-${questionId}`}
                  value={label}
                  checked={isSelected}
                  onChange={() => onSelect(questionId, label)}
                  disabled={disabled}
                />
                <span className="option-letter" aria-hidden="true">
                  {label}
                </span>
                <span className="option-text">{text}</span>
                <span className="option-check" aria-hidden="true">
                  <IconCheck />
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
