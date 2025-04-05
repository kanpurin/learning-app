import React, { useState } from 'react';
import Question from './components/Question';
import CreateQuestion from './components/CreateQuestion';
import CSVReader from './components/CSVReader';
import CSVWriter from './components/CSVWriter';
import './App.css';

const App = () => {
  const [questions, setQuestions] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' または 'create'
  const [fileName, setFileName] = useState('questions_data'); // デフォルトのファイル名

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
        <h1>クイズアプリ</h1>
        <button className="hamburger-icon" onClick={toggleSidebar}>
          &#9776;
        </button>
      </header>

      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <h5>CSVファイルのアップロード</h5>
        <CSVReader onDataLoad={handleDataLoad} questions={questions}/>

        {questions.length > 0 && (
          <div className="mt-4">
            <CSVWriter questions={questions} fileName={fileName} setFileName={setFileName} />
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
                onClick={() => setActiveTab('quiz')}
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
          </ul>
        </div>

        {/* コンテンツ表示切替 */}
        {activeTab === 'quiz' && questions.length > 0 && (
          <Question questions={questions} setQuestions={setQuestions} />
        )}
        {activeTab === 'create' && (
          <CreateQuestion questions={questions} setQuestions={setQuestions}/>
        )}
      </div>
    </div>
  );
};

export default App;
