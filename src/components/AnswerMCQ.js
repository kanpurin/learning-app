import React from 'react';

const AnswerMCQ = ({ option, optionIndex, selectedIndex, isAnswered, handleChange}) => {
  return (
    <label className='list-group-item list-group-item-action py-2 d-flex align-items-center'>
      <input
        className="form-check-input me-2"
        type="radio"
        value={optionIndex}
        checked={selectedIndex === optionIndex}
        disabled={isAnswered}
        onChange={handleChange}
      />
      {option}
    </label>
  );
};

export default AnswerMCQ;
