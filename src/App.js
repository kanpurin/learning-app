import React, { useState } from 'react';
import Question from './components/Question';
import CSVReader from './components/CSVReader';
import CSVWriter from './components/CSVWriter';  // CSVWriterをインポート
import './App.css';

const App = () => {
  const [questions, setQuestions] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // CSV読み込みデータを受け取る処理
  const handleDataLoad = (newQuestions) => {
    setQuestions(newQuestions);
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
        <CSVReader onDataLoad={handleDataLoad} />  {/* CSV読み込みコンポーネント */}
        
        {questions.length > 0 && (
          <div className="mt-4">
            <CSVWriter questions={questions} />  {/* 学習履歴CSVを保存するボタン */}
          </div>
        )}
      </div>

      <div className="main-content">
        {questions.length > 0 && (
          <Question questions={questions} setQuestions={setQuestions} />
        )}
      </div>
    </div>
  );
};

export default App;
