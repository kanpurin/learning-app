import React from 'react';

function SaveButton({ questions }) {
  const saveQuestions = () => {
    let csvContent = "問題文,選択肢1,選択肢2,選択肢3,選択肢4,選択肢5,正解,出題日時,出題回数,正解回数,正解率,記憶強度,次回復習日,問題タイプ\n";
    questions.forEach((question) => {
      let row = `${question.problem},${question.options.join(',')},${question.correctAnswer},${question.date},${question.attempts},${question.correctCount},${question.correctRate},${question.strength},${question.reviewDate},${question.type}`;
      csvContent += row + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'questions.csv';
    link.click();
  };

  return (
    <button onClick={saveQuestions} className="save-button">
      学習履歴保存
    </button>
  );
}

export default SaveButton;
