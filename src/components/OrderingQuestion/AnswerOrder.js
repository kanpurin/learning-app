import React from 'react';
import MarkdownArea from '../MarkdownArea';

const AnswerMRQ = ({ option, index, selectedOptions, handleSelect, isAnswered }) => {
  const selectedIndex = selectedOptions.indexOf(index + 1) + 1;

  return (
    <label className="list-group-item d-flex align-items-center">
      <span 
        className="me-2 d-inline-block text-center border rounded-circle" 
        style={{ width: '24px', height: '24px', lineHeight: '24px' }}>
        {selectedIndex > 0 ? selectedIndex : ''}
      </span>
      <input
        type="checkbox"
        className="form-check-input me-2 d-none"
        checked={selectedIndex > 0}
        disabled={isAnswered}
        onChange={() => handleSelect(index + 1)}
      />
      <MarkdownArea text={option} margin="0em"/>
    </label>
  );
};

export default AnswerMRQ;