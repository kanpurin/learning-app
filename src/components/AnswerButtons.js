import React from 'react';
import NextQuestion from './NextQuestion';

const AnswerButtons = ({ handleAnswer, handleNextQuestion, isAnswered, selectedIndex }) => {
  return (
    <div className="d-flex justify-content-center gap-3 mt-4">
      <button
        onClick={handleAnswer}
        className="btn btn-primary btn-lg w-50"
        disabled={isAnswered || selectedIndex === -1}
      >
        回答する
      </button>
      <NextQuestion onNext={handleNextQuestion} disabled={!isAnswered} />
    </div>
  );
};

export default AnswerButtons;
