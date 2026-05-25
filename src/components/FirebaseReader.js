import React, { useState } from 'react';
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { firestoreDb, QUESTION_SETS_COLLECTION } from '../lib/firebaseApp';
import { normalizeQuestions } from '../lib/questionData';

const FirebaseReader = ({ loadJSON, questions }) => {
  const [loading, setLoading] = useState(false);
  const [sets, setSets] = useState([]);
  const [showList, setShowList] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(firestoreDb, QUESTION_SETS_COLLECTION));
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
    if (questions.length > 0 && !window.confirm('既存の問題が上書きされます。続行しますか？')) {
      return;
    }

    setLoading(true);
    try {
      const snap = await getDoc(doc(firestoreDb, QUESTION_SETS_COLLECTION, id));
      if (!snap.exists()) {
        alert('データが見つかりませんでした');
        return;
      }

      loadJSON(normalizeQuestions(snap.data().questions || []), name);
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
      <button onClick={fetchList} className="btn btn-outline-primary w-100" disabled={loading}>
        {loading ? '読み込み中...' : 'Firebase から読み込む'}
      </button>

      {showList && (
        <div style={{ marginTop: 8, border: '1px solid #dee2e6', borderRadius: 6, padding: 12, backgroundColor: '#f8f9fa' }}>
          <p className="small text-muted mb-2">保存済みのセットを選択してください</p>
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
                {s.name}
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

