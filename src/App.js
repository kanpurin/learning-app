import React, { useState, useEffect } from 'react';
import Question from './components/Question';
import CreateQuestion from './components/CreateQuestion';
import EditQuestion from './components/EditQuestion';
import JSONReader from './components/JSONReader';
import JSONWriter from './components/JSONWriter';
import './App.css';

const App = () => {
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('questions');
    return saved ? JSON.parse(saved) : [];
  });
  const [fileName, setFileName] = useState(() => {
    const saved = localStorage.getItem('fileName');
    return saved || 'questions_data';
  });
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('activeTab');
    return saved || 'quiz';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedFlags, setSavedFlags] = useState(questions.map(() => true));

  useEffect(() => {
    localStorage.setItem('questions', JSON.stringify(questions));
  }, [questions]);
  
  useEffect(() => {
    localStorage.setItem('fileName', fileName);
  }, [fileName]);
  
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const handleDataLoad = (newQuestions, uploadedFileName) => {
    setQuestions(newQuestions);
    setFileName(uploadedFileName);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 onClick={() => {localStorage.clear(); window.location.reload();}}>クイズアプリ</h1>
        <button className="hamburger-icon" onClick={toggleSidebar}>
          &#9776;
        </button>
      </header>

      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <h5>CSVファイルのアップロード</h5>
        <JSONReader onDataLoad={handleDataLoad} questions={questions}/>

        {questions.length > 0 && (
          <div className="mt-4">
            <JSONWriter questions={questions} fileName={fileName} setFileName={setFileName} />
          </div>
        )}
      </div>

      <div className="main-content" style={{ overflowY: 'auto' }}>
        {/* タブ部分 */}
        <div className="d-flex justify-content-center mt-3">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'quiz' ? 'active' : ''}`}
                style={{ minWidth: '150px' }}
                onClick={() => {
                  const hasUnsavedQuestions = savedFlags.some(f => f === false);
                  if (hasUnsavedQuestions) {
                    alert('保存されていない問題があります。問題を解く前に保存してください。');
                    return;
                  }
                  setActiveTab('quiz');
                }}
              >
                問題を解く
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
                style={{ minWidth: '150px' }}
                onClick={() => setActiveTab('create')}
              >
                問題を作る
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'edit' ? 'active' : ''}`}
                style={{ minWidth: '150px' }}
                onClick={() => setActiveTab('edit')}
              >
                問題を編集する
              </button>
            </li>
          </ul>
        </div>

        {/* コンテンツ表示切替 */}
        <div style={{ display: activeTab === 'quiz' ? 'block' : 'none' }}>
          {questions.length > 0 && (
            <Question questions={questions} setQuestions={setQuestions} />
          )}
        </div>
        <div style={{ display: activeTab === 'create' ? 'block' : 'none' }}>
          <CreateQuestion questions={questions} setQuestions={setQuestions} />
        </div>
        <div style={{ display: activeTab === 'edit' ? 'block' : 'none' }}>
          {questions.length > 0 && (
            <EditQuestion questions={questions} setQuestions={setQuestions} savedFlags={savedFlags} setSavedFlags={setSavedFlags} />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
