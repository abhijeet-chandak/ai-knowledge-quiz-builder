const LABELS = ['A', 'B', 'C', 'D'];

export default function QuizResultCard({ item, index }) {
  const { question, options, userAnswer, correctAnswer, explanation, isCorrect } = item;
  return (
    <article
      className={`result-card ${isCorrect ? 'result-card--correct' : 'result-card--wrong'}`}
    >
      <div className="result-card__top">
        <span className="result-card__q badge">Question {index + 1}</span>
        <span className={isCorrect ? 'tag success' : 'tag danger'}>
          {isCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </div>
      <h3 className="result-question">{question}</h3>
      <div className="result-answers">
        <div className="result-answer-block">
          <span className="result-answer-block__label">Your answer</span>
          <div className="result-answer-block__body">
            {userAnswer && LABELS.includes(userAnswer) ? (
              <>
                <span className="result-option-pill mono">{userAnswer}</span>
                <span className="result-option-text">{options[userAnswer]}</span>
              </>
            ) : (
              <em className="muted">No answer</em>
            )}
          </div>
        </div>
        <div className="result-answer-block">
          <span className="result-answer-block__label">Correct</span>
          <div className="result-answer-block__body">
            <span className="result-option-pill result-option-pill--correct mono">
              {correctAnswer}
            </span>
            <span className="result-option-text">{options[correctAnswer]}</span>
          </div>
        </div>
      </div>
      <div className="explanation-box">
        <strong>Explanation</strong>
        <p>{explanation}</p>
      </div>
    </article>
  );
}
