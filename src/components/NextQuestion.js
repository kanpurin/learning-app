import React from 'react';

const NextQuestion = ({ onNext, disabled }) => {
  return (
    <button 
      onClick={onNext} 
      disabled={disabled} 
      className="btn btn-secondary btn-lg w-50"
    >
      次の問題
    </button>
  );
};

export default NextQuestion;