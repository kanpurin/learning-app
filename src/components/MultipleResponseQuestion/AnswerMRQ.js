import React from 'react';

const AnswerMRQ = ({ option, optionIndex, selectedIndices, isAnswered, handleChange }) => {
  return (
    <label className='list-group-item list-group-item-action py-2 d-flex align-items-center'>
      <input
        className="form-check-input me-2"
        type="checkbox"
        value={optionIndex}
        checked={selectedIndices.includes(optionIndex)}
        disabled={isAnswered}
        onChange={handleChange}
      />
      {option}
    </label>
  );
};

export default AnswerMRQ;
