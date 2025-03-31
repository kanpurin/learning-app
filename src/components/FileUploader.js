import React from 'react';

function FileUploader({ onFileUpload }) {
  return (
    <div>
      <input type="file" accept=".csv" onChange={onFileUpload} />
    </div>
  );
}

export default FileUploader;
