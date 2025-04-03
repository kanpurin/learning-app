import React from 'react';
import MarkdownArea from './MarkdownArea';

const AnswerFeedback = ({ explanation, isAnswered, isCorrect }) => {
  return (
    isAnswered && (
      <div className={`alert mt-3 text-center ${isCorrect ? 'alert-success' : 'alert-danger'}`} role="alert">
        <MarkdownArea text={explanation} />
      </div>
    )
  );
};

export default AnswerFeedback;
