import React from 'react';

const AnswerButtons = ({ handleAnswer, disabled }) => {
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

export default AnswerButtons;