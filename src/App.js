import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import Question from './components/Question';
import CreateQuestion from './components/CreateQuestion';
import EditQuestion from './components/EditQuestion';
import JSONReader from './components/JSONReader';
import JSONWriter from './components/JSONWriter';
import './App.css';

// Dexie DB 定義
const db = new Dexie('QuizAppDB');
db.version(1).stores({ store: '&key'});
const useSaveToDB = (key, value) => {
  useEffect(() => {
    if (value === null) return;
    db.store.put({ key, value });
  }, [key, value]);
};

const App = () => {
  const [questions, setQuestions] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedFlags, setSavedFlags] = useState([]);

  // 初期読み込み
  useEffect(() => {
    const loadData = async () => {
      const q = await db.store.get('questions');
      const f = await db.store.get('fileName');
      const t = await db.store.get('activeTab');
      setQuestions(q?.value || []);
      setFileName(f?.value || 'questions_data');
      setActiveTab(t?.value || 'quiz');
      setSavedFlags((q?.value || []).map(() => true));
    };
    loadData();
  }, []);
  
  useSaveToDB('questions', questions);
  useSaveToDB('fileName', fileName);
  useSaveToDB('activeTab', activeTab);

  const handleDataLoad = async (newQuestions, uploadedFileName) => {
    setQuestions(newQuestions);
    setFileName(uploadedFileName);
    setSavedFlags(newQuestions.map(() => true));
    setIsSidebarOpen(false);
  };
  
  const handleTabChange = (tab) => {
    if (tab === 'quiz' && savedFlags.some(f => !f)) {
      alert('保存されていない問題があります。問題を解く前に保存してください。');
      return;
    }
    setActiveTab(tab);
  };

  const resetAll = async () => {
    await db.store.clear();
    window.location.reload();
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 onClick={resetAll}>クイズアプリ</h1>
        <button className="hamburger-icon" onClick={() => setIsSidebarOpen(prev => !prev)}>
          &#9776;
        </button>
      </header>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <h5>CSVファイルのアップロード</h5>
        <JSONReader onDataLoad={handleDataLoad} questions={questions} />
        {questions?.length > 0 && (
          <div className="mt-4">
            <JSONWriter questions={questions} fileName={fileName} setFileName={setFileName} />
          </div>
        )}
      </aside>

      <main className="main-content" style={{ overflowY: 'auto' }}>
        <nav className="d-flex justify-content-center mt-3">
          <ul className="nav nav-tabs">
            {['quiz', 'create', 'edit'].map(tab => (
              <li className="nav-item" key={tab}>
                <button
                  className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                  style={{ minWidth: '150px' }}
                  onClick={() => handleTabChange(tab)}
                >
                  {{
                    quiz: '問題を解く',
                    create: '問題を作る',
                    edit: '問題を編集する',
                  }[tab]}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {activeTab === 'quiz' && questions?.length > 0 && (
          <Question questions={questions} setQuestions={setQuestions} />
        )}
        {activeTab === 'create' && (
          <CreateQuestion questions={questions} setQuestions={setQuestions} />
        )}
        {activeTab === 'edit' && questions?.length > 0 && (
          <EditQuestion
            questions={questions}
            setQuestions={setQuestions}
            savedFlags={savedFlags}
            setSavedFlags={setSavedFlags}
          />
        )}
      </main>
    </div>
  );
};

export default App;
