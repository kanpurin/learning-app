import React from 'react';
import MarkdownArea from '../MarkdownArea';

const AnswerMRQ = ({ option, optionIndex, checked, onChange, onClick, onDelete, disabled }) => {
  return (
    <label 
      className='list-group-item list-group-item-action py-2 d-flex justify-content-between align-items-center'
      onClick={onClick}
    >
      <div className="d-flex align-items-center">
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
      </div>
      {onDelete && 
        <button
          type="button"
          className="btn btn-sm text-danger p-0"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(optionIndex - 1);
          }}
        >
          <span className="fs-5">×</span>
        </button>
      }
    </label>
  );
};

export default AnswerMRQ;
