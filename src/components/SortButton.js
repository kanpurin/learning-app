import React from 'react';

function SortButton({ index, option, onClick }) {
  return (
    <button
      onClick={() => onClick(index)}
      className="option-button"
    >
      {option}
    </button>
  );
}

export default SortButton;
