import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
  addDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { firestoreDb, QUESTION_SETS_COLLECTION } from '../lib/firebaseApp';
import { serializeQuestions } from '../lib/questionData';

const FirebaseWriter = ({ questions, fileName }) => {
  const [loading, setLoading] = useState(false);
  const [showOverwriteList, setShowOverwriteList] = useState(false);
  const [existingSets, setExistingSets] = useState([]);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    if (fileName) {
      setSaveName(fileName.replace('.json', ''));
    }
  }, [fileName]);

  const createPayload = (name) => ({
    name,
    questions: serializeQuestions(questions),
    updatedAt: serverTimestamp(),
  });

  const saveNew = async () => {
    const name = saveName.trim() || '無題のセット';
    if (questions.length === 0) {
      alert('保存する問題がありません');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(firestoreDb, QUESTION_SETS_COLLECTION), createPayload(name));
      alert(`「${name}」を新規保存しました`);
      setSaveName('');
    } catch (e) {
      alert('保存に失敗しました。セキュリティルールを確認してください。');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openOverwriteList = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(firestoreDb, QUESTION_SETS_COLLECTION));
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name ?? d.id,
      }));
      setExistingSets(items);
      setShowOverwriteList(true);
    } catch (e) {
      alert('一覧の取得に失敗しました');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const overwrite = async (id, name) => {
    if (!window.confirm(`「${name}」を上書きしますか？`)) return;

    setLoading(true);
    try {
      await setDoc(doc(firestoreDb, QUESTION_SETS_COLLECTION, id), createPayload(name), { merge: false });
      alert(`「${name}」を上書きしました`);
      setShowOverwriteList(false);
    } catch (e) {
      alert('上書きに失敗しました');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3" style={{ maxWidth: '400px' }}>
      <div className="input-group mb-2">
        <input
          type="text"
          className="form-control"
          placeholder="保存するセット名を入力"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
        />
        <button onClick={saveNew} className="btn btn-primary" disabled={loading || questions.length === 0}>
          {loading ? '保存中...' : '新規保存'}
        </button>
      </div>

      <button
        onClick={openOverwriteList}
        className="btn btn-outline-secondary w-100"
        disabled={loading || questions.length === 0}
      >
        既存セットに上書き保存...
      </button>

      {showOverwriteList && (
        <div className="mt-2 p-3 border rounded bg-light">
          <h6 className="small font-weight-bold">上書き先を選択</h6>
          {existingSets.length === 0 ? (
            <p className="small text-muted">保存済みのデータはありません</p>
          ) : (
            existingSets.map((s) => (
              <button
                key={s.id}
                onClick={() => overwrite(s.id, s.name)}
                className="btn btn-sm btn-light w-100 mb-1 text-start border"
              >
                {s.name}
              </button>
            ))
          )}
          <button onClick={() => setShowOverwriteList(false)} className="btn btn-sm btn-link w-100 text-muted">
            キャンセル
          </button>
        </div>
      )}
    </div>
  );
};

export default FirebaseWriter;

