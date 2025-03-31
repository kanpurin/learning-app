import React from 'react';

const AnswerFeedback = ({ explanation, isAnswered, isCorrect }) => {
  return (
    isAnswered && (
      <div className={`alert mt-3 text-center ${isCorrect ? 'alert-success' : 'alert-danger'}`} role="alert">
        {explanation}
      </div>
    )
  );
};

export default AnswerFeedback;
