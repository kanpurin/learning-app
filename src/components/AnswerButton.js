import React from 'react';

const AnswerButton = ({ handleAnswer, disabled }) => {
  return (
    <button
      onClick={handleAnswer}
      className="btn btn-primary btn-lg w-50"
      disabled={disabled}
    >
      回答する
    </button>
  );
};

export default AnswerButton;