import React from 'react';
import GoogleDriveWriter from './GoogleDriveWriter';
import { createEmptyCard } from 'ts-fsrs';

// 学習履歴JSONを保存するコンポーネント
const JSONWriter = ({ questions, fileName, setFileName }) => {
  const handleFileNameChange = (event) => {
    setFileName(event.target.value);
  };

  const handleDownload = () => {
    const dataToExport = questions
      .filter((question) => !question.deleted)
      .map((question) => ({
      problem: question.problem,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation || '',
      type: question.type,
      summary: question.summary || '',
      tags: question.tags || [],
      card: question.card || createEmptyCard(),
      random: question.random || false,
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
        <button className="btn btn-success form-control" onClick={handleDownload}>
          学習履歴JSONを保存
        </button>
        <GoogleDriveWriter questions={questions} fileName={fileName} />
      </div>
    </div>
  );
};

export default JSONWriter;