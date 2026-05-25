import React from 'react';
// import GoogleDriveWriter from './GoogleDriveWriter';
import FirebaseWriter from './FirebaseWriter';
import { serializeQuestions } from '../lib/questionData';

const JSONWriter = ({ questions, fileName, setFileName, user }) => {
  const handleFileNameChange = (event) => {
    setFileName(event.target.value);
  };

  const handleDownload = () => {
    const json = JSON.stringify(serializeQuestions(questions), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}`;
    link.click();
  };

  return (
    <div>
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
        {user && (
          <>
            {/* <GoogleDriveWriter questions={questions} fileName={fileName} /> */}
            <FirebaseWriter questions={questions} fileName={fileName} />
          </>
        )}
      </div>
    </div>
  );
};

export default JSONWriter;

