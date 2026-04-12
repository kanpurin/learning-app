import React, { useState } from 'react';
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  initializeFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
// JSONReaderと同じ初期化ロジックを通すためにインポート
import { createEmptyCard } from "ts-fsrs";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCZooFoR2dYEa0-pnTzaVykWMi_f5iYjx0",
  authDomain: "learningapp-5cad1.firebaseapp.com",
  projectId: "learningapp-5cad1",
  storageBucket: "learningapp-5cad1.firebasestorage.app",
  messagingSenderId: "774920369319",
  appId: "1:774920369319:web:617727d38d9c61e44a9782",
  measurementId: "G-65WM600N0L"
};

const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
});
const COLLECTION = 'questionSets';

const FirebaseReader = ({ loadJSON, questions }) => {
  const [loading, setLoading] = useState(false);
  const [sets, setSets] = useState([]);
  const [showList, setShowList] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      const items = snapshot.docs.map((d) => ({ id: d.id, name: d.data().name ?? d.id }));
      setSets(items);
      setShowList(true);
    } catch (e) {
      alert('一覧の取得に失敗しました');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSet = async (id, name) => {
    if (questions.length > 0) {
      if (!window.confirm('既存の問題が上書きされます。続行しますか？')) return;
    }
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, COLLECTION, id));
      if (!snap.exists()) {
        alert('データが見つかりませんでした');
        return;
      }

      const rawData = snap.data();
      const rawQuestions = rawData.questions || [];

      // ▼ ここで JSONReader が期待するオブジェクト構造に整形する
      const formattedQuestions = rawQuestions.map((item) => ({
        problem: item.problem || '',
        options: item.options || [],
        answer: item.answer || '',
        explanation: item.explanation || '',
        type: item.type || 'multiple-choice',
        summary: item.summary || '',
        deleted: false,
        tags: item.tags || [],
        // Firestoreにcard情報があればそれを使用、なければ新規作成
        card: item.card || createEmptyCard(),
        random: item.random || false,
      }));

      // 整形済みのデータを JSONReader の loadJSON に渡す
      loadJSON(formattedQuestions, name);
      setShowList(false);
    } catch (e) {
      alert('読み込みに失敗しました');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <button
        onClick={fetchList}
        className="btn btn-outline-primary w-100" // Bootstrapのクラスを適用
        disabled={loading}
      >
        {loading ? '読み込み中...' : 'Firebase から読み込む'}
      </button>

      {showList && (
        <div style={{ marginTop: 8, border: '1px solid #dee2e6', borderRadius: 6, padding: 12, backgroundColor: '#f8f9fa' }}>
          <p className="small text-muted mb-2">保存済みのセットを選択してください：</p>
          {sets.length === 0 ? (
            <p className="small text-center my-3">データがありません</p>
          ) : (
            sets.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSet(s.id, s.name)}
                className="btn btn-light w-100 text-start mb-2 border-sm"
                style={{ fontSize: '0.9rem' }}
              >
                📁 {s.name}
              </button>
            ))
          )}
          <button
            onClick={() => setShowList(false)}
            className="btn btn-link btn-sm w-100 text-decoration-none text-secondary"
          >
            キャンセル
          </button>
        </div>
      )}
    </div>
  );
};

export default FirebaseReader;