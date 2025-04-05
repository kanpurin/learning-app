import React from 'react';
import MarkdownArea from '../MarkdownArea';

const AnswerMRQ = ({ option, optionIndex, checked, onChange, onClick, disabled }) => {
  return (
    <label 
      className='list-group-item list-group-item-action py-2 d-flex align-items-center'
      onClick={onClick}
    >
      <input
        className="form-check-input me-2"
        type="checkbox"
        value={optionIndex}
        checked={checked}
        onChange={onChange}
        onClick={(e) => e.stopPropagation()}
        disabled={disabled}
      />
      <MarkdownArea text={option} margin="0em"/>
    </label>
  );
};

export default AnswerMRQ;
