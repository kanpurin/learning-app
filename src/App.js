import React, { useState } from 'react';
import Question from './components/Question';
import CreateQuestion from './components/CreateQuestion';
import EditQuestion from './components/EditQuestion';
import JSONReader from './components/JSONReader';
import JSONWriter from './components/JSONWriter';
import GoogleLogin from './components/GoogleLogin';
import { clearQuizPersistence, useQuizPersistence } from './hooks/useQuizPersistence';
import './App.css';

const TABS = [
  { id: 'quiz', label: '問題を解く' },
  { id: 'create', label: '問題を作る' },
  { id: 'edit', label: '問題を編集する' },
];

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const {
    questions,
    setQuestions,
    fileName,
    setFileName,
    activeTab,
    setActiveTab,
    savedFlags,
    setSavedFlags,
  } = useQuizPersistence();

  const handleDataLoad = async (newQuestions, uploadedFileName) => {
    setQuestions(newQuestions);
    setFileName(uploadedFileName);
    setSavedFlags(newQuestions.map(() => true));
    setIsSidebarOpen(false);
  };

  const handleTabChange = (tab) => {
    setQuestions((prevQuestions) => (prevQuestions || []).filter((q) => !q.deleted));

    if (tab === 'quiz' && savedFlags.some((flag) => !flag)) {
      alert('保存されていない問題があります。問題を解く前に保存してください。');
      return;
    }

    setActiveTab(tab);
  };

  const resetAll = async () => {
    await clearQuizPersistence();
    window.location.reload();
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 onClick={resetAll}>クイズアプリ</h1>
        <button className="hamburger-icon" onClick={() => setIsSidebarOpen((prev) => !prev)}>
          &#9776;
        </button>
      </header>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <GoogleLogin onUserChange={setUser} />
        <h5>問題データ</h5>
        <JSONReader onDataLoad={handleDataLoad} questions={questions || []} user={user} />
        {questions?.length > 0 && (
          <div className="mt-4">
            <JSONWriter questions={questions} fileName={fileName} setFileName={setFileName} user={user} />
          </div>
        )}
      </aside>

      <main className="main-content" style={{ overflowY: 'auto' }}>
        <nav className="d-flex justify-content-center mt-3">
          <ul className="nav nav-tabs">
            {TABS.map((tab) => (
              <li className="nav-item" key={tab.id}>
                <button
                  className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                  style={{ minWidth: '150px' }}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ display: activeTab === 'quiz' ? 'block' : 'none' }}>
          {questions?.length > 0 && <Question questions={questions} setQuestions={setQuestions} />}
        </div>
        <div style={{ display: activeTab === 'create' ? 'block' : 'none' }}>
          <CreateQuestion questions={questions || []} setQuestions={setQuestions} />
        </div>
        <div style={{ display: activeTab === 'edit' ? 'block' : 'none' }}>
          {questions?.length > 0 && (
            <EditQuestion
              questions={questions}
              setQuestions={setQuestions}
              savedFlags={savedFlags}
              setSavedFlags={setSavedFlags}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
