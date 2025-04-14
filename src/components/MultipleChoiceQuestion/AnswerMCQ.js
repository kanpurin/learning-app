import React from 'react';
import MarkdownArea from '../MarkdownArea';

const AnswerMCQ = ({ option, optionIndex, checked, onChange, onClick, onDelete, disabled }) => {
  return (
    <label 
      className="list-group-item list-group-item-action py-2 d-flex justify-content-between align-items-center"
      onClick={onClick}
    >
      <div className="d-flex flex-grow-1 align-items-center" style={{ gap: '0.5em' }}>
        <input
          className="form-check-input"
          type="radio"
          value={optionIndex}
          checked={checked}
          onChange={onChange}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        />
        <div style={{ flex: 1 }}>
          <MarkdownArea text={option} margin="0em" />
        </div>
      </div>
      {onDelete && 
        <button
          type="button"
          className="btn btn-sm text-danger p-0 ms-2"
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

export default AnswerMCQ;
