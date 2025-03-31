import React from 'react';

const AnswerOption = ({ option, optionIndex, selectedIndex, isAnswered, handleChange, isCorrect, correctIndex }) => {
  const getOptionClass = () => {
    let optionClass = 'list-group-item list-group-item-action py-2 d-flex align-items-center';
    if (isAnswered) {
      if (optionIndex === selectedIndex) {
        optionClass += isCorrect ? ' bg-success-subtle text-dark' : ' bg-danger-subtle text-dark';
      } else if (optionIndex === correctIndex && !isCorrect) {
        optionClass += ' bg-success-subtle text-dark'; // 正解の選択肢（緑）
      }
    }
    return optionClass;
  };

  return (
    <label className={getOptionClass()}>
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

export default AnswerOption;
