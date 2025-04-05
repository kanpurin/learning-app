import React from 'react';
import MarkdownArea from '../MarkdownArea';

const AnswerMRQ = ({ option, optionIndex, selectedIndices, isAnswered, handleChange }) => {
  return (
    <label className='list-group-item list-group-item-action py-2 d-flex align-items-center'>
      <input
        className="form-check-input me-2"
        type="checkbox"
        checked={selectedIndices.includes(optionIndex)}
        disabled={isAnswered}
        onChange={handleChange}
      />
      <MarkdownArea text={option} margin="0em"/>
    </label>
  );
};

export default AnswerMRQ;
