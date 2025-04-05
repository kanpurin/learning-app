import React, { useState } from 'react';
import Papa from 'papaparse';

// 学習履歴CSVを保存するコンポーネント
const CSVWriter = ({ questions, fileName, setFileName }) => {
  // ファイル名変更時のハンドラ
  const handleFileNameChange = (event) => {
    setFileName(event.target.value);
  };

  const handleDownload = () => {
    // questionsのデータをCSV形式に変換
    const dataToExport = questions.map((question) => ({
      問題文: question.problem,
      選択肢1: question.options[0],
      選択肢2: question.options[1],
      選択肢3: question.options[2] || '',
      選択肢4: question.options[3] || '',
      選択肢5: question.options[4] || '',
      正解: question.answer.join(','),
      解説: question.explanation || '',
      出題回数: question.attempts,
      正解回数: question.correctCount,
      優先度: question.priority,
      経過問題数: question.gap,
      問題タイプ: question.type,
    }));

    const csv = Papa.unparse(dataToExport);  // データをCSV形式に変換
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;  // ユーザーが指定したファイル名でダウンロード
    link.click();  // ダウンロードをトリガー
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
        学習履歴CSVを保存
      </button>
    </div>
  );
};

export default CSVWriter;
