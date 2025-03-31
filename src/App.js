import React, { useState } from 'react';
import Question from './components/Question';
import CSVReader from './components/CSVReader';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [questions, setQuestions] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);  // サイドバーの開閉状態

  // CSV読み込みデータを受け取る処理
  const handleDataLoad = (newQuestions) => {
    setQuestions(newQuestions);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);  // サイドバーの開閉を切り替え
  };

  return (
    <div className="d-flex">
      {/* サイドバー */}
      <div className={`bg-light p-4 ${isSidebarOpen ? 'd-block' : 'd-none'}`} style={{ width: '300px', position: 'fixed', height: '100%' }}>
        <h5>CSVファイルのアップロード</h5>
        <CSVReader onDataLoad={handleDataLoad} />  {/* CSV読み込みコンポーネント */}
      </div>

      {/* メインコンテンツ */}
      <div className="flex-grow-1" style={{ marginLeft: isSidebarOpen ? '300px' : '0', transition: 'margin-left 0.3s' }}>
        {questions.length > 0 && (
          <Question questions={questions} />
        )}
      </div>

      {/* サイドバーのトグルボタン */}
      <button 
        className="btn btn-primary position-fixed"
        style={{
          top: '20px',
          left: isSidebarOpen ? '300px' : '20px',
          transition: 'left 0.3s',
        }}
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? '閉じる' : '開く'}
      </button>
    </div>
  );
};

export default App;
