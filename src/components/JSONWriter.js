import React from 'react';

// 学習履歴JSONを保存するコンポーネント
const JSONWriter = ({ questions, fileName, setFileName }) => {
  const handleFileNameChange = (event) => {
    setFileName(event.target.value);
  };

  const handleDownload = () => {
    const dataToExport = questions.map((question) => ({
      problem: question.problem,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation || '',
      attempts: question.attempts,
      correctCount: question.correctCount,
      priority: question.priority,
      gap: question.gap,
      type: question.type,
      summary: question.summary || '',
      stability: question.stability || '',
      difficulty: question.difficulty || '',
      lastAnsweredDate: question.lastAnsweredDate || '',
    }));

    const json = JSON.stringify(dataToExport, null, 2); // 整形して見やすく
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}`;
    link.click();
  };

  return (
    <div>
      {/* ファイル名入力フィールド */}
      <div className="mb-3">
        <label htmlFor="file-name" className="form-label">ファイル名</label>
        <input
          type="text"
          id="file-name"
          className="form-control"
          value={fileName}
          onChange={handleFileNameChange}
          placeholder="ファイル名を入力"
        />
      </div>

      <button className="btn btn-success" onClick={handleDownload}>
        学習履歴JSONを保存
      </button>
    </div>
  );
};

export default JSONWriter;
