import React, { useState } from 'react';

const JSONReader = ({ onDataLoad, questions }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event) => {
    if (questions.length > 0) {
      if (!window.confirm('既存の問題が上書きされます。続行しますか？')) {
        return;
      }
    }

    const file = event.target.files[0];
    if (file && file.name.endsWith('.json')) {
      setIsLoading(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          loadJSON(jsonData, file.name);
        } catch (error) {
          alert('JSONの読み込みに失敗しました。形式を確認してください。');
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const loadJSON = (data, fileName) => {
    const newQuestions = data.map((item) => ({
      problem: item.problem,
      options: item.options,
      answer: item.answer,
      explanation: item.explanation,
      attempts: parseInt(item.attempts, 10),
      correctCount: parseInt(item.correctCount, 10),
      priority: parseFloat(item.priority),
      gap: parseInt(item.gap, 10),
      type: item.type,
      summary: item.summary || '',
      deleted: false
    }));

    onDataLoad(newQuestions, fileName);
    setIsLoading(false);
  };

  return (
    <div className="container mt-4">
      <div className="card p-4 shadow-sm">
        <h5 className="mb-3">JSONファイルをアップロード</h5>
        <p className="text-muted mb-4">
          正しいフォーマットのJSONファイルをアップロードしてください。
        </p>
        <div className="d-flex justify-content-center mb-3">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="form-control"
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default JSONReader;
