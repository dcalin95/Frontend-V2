import React, { useState } from 'react';

const QuizCard = ({ title = 'Quick Quiz', questions = [], onComplete }) => {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!questions.length) return null;

  const current = questions[index];

  const handleAnswer = (choiceIdx) => {
    const isCorrect = choiceIdx === current.correct;
    if (isCorrect) setScore((s) => s + 1);

    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      setFinished(true);
      onComplete && onComplete({ score: isCorrect ? score + 1 : score, total: questions.length });
    }
  };

  return (
    <div className="quiz-card">
      <div className="quiz-header">
        <h3>{title}</h3>
        <div className="quiz-progress">{Math.min(index + 1, questions.length)}/{questions.length}</div>
      </div>

      {!finished ? (
        <div className="quiz-body">
          <p className="quiz-question">{current.q}</p>
          <div className="quiz-answers">
            {current.choices.map((c, i) => (
              <button key={i} className="quiz-answer" onClick={() => handleAnswer(i)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="quiz-result">
          <div className="quiz-score">Score: {score}/{questions.length}</div>
          <div className="quiz-cta">Great! Continue learning or share your progress in Telegram.</div>
        </div>
      )}
    </div>
  );
};

export default QuizCard;







