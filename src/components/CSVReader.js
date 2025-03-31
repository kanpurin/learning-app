import React, { useState } from 'react';
import Papa from 'papaparse';

const CSVReader = ({ onDataLoad }) => {
  const [isLoading, setIsLoading] = useState(false);  // ローディング状態

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setIsLoading(true);  // 読み込み中フラグ

      const reader = new FileReader();
      reader.onload = (e) => {
        loadCSV(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const loadCSV = (csvData) => {
    const parsedData = Papa.parse(csvData, { header: true, skipEmptyLines: true });

    const newQuestions = parsedData.data.map((row) => ({
      problem: row['問題文'],
      options: [
        row['選択肢1'],
        row['選択肢2'],
        row['選択肢3'] || '',
        row['選択肢4'] || '',
        row['選択肢5'] || '',
      ].filter((opt) => opt),
      answer: row['正解'] ? row['正解'].split(',').map((n) => parseInt(n, 10)) : [],
      explanation: row['解説'],
      date: row['出題日時'],
      attempts: parseInt(row['出題回数'], 10) || 0,
      correctCount: parseInt(row['正解回数'], 10) || 0,
      correctRate: parseFloat(row['正解率']) || 0,
      strength: parseInt(row['記憶強度'], 10) || 0,
      reviewDate: row['次回復習日'],
      type: row['問題タイプ'],
    }));

    onDataLoad(newQuestions); // 親コンポーネントにデータを渡す
    setIsLoading(false);  // ローディング終了
  };

  return (
    <div className="container mt-4">
      <div className="card p-4 shadow-sm">
        <h5 className="mb-3">CSVファイルをアップロード</h5>
        <p className="text-muted mb-4">
          正しいフォーマットのCSVファイルをアップロードしてください。
        </p>

        <div className="d-flex justify-content-center mb-3">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="form-control"
            disabled={isLoading} // ローディング中は無効化
          />
        </div>
      </div>
    </div>
  );
};

export default CSVReader;
