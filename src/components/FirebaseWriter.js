import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  initializeFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
  addDoc, // 自動ID生成用にインポート
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

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

/**
 * FirebaseWriter
 * * props.questions: 現在アプリに読み込まれている問題配列
 * props.fileName:  デフォルトのセット名
 */
const FirebaseWriter = ({ questions, fileName }) => {
  const [loading, setLoading] = useState(false);
  const [showOverwriteList, setShowOverwriteList] = useState(false);
  const [existingSets, setExistingSets] = useState([]);
  const [saveName, setSaveName] = useState('');

  // fileNameが変わったら入力欄を更新
  useEffect(() => {
    if (fileName) {
      // 拡張子 .json を除いた名前を初期値にする
      setSaveName(fileName.replace('.json', ''));
    }
  }, [fileName]);

  // 新規保存
  const saveNew = async () => {
    const name = saveName.trim() || '無題セット';
    if (questions.length === 0) {
      alert('保存する問題がありません');
      return;
    }

    setLoading(true);
    try {
      // 1. コレクション参照を取得
      const colRef = collection(db, COLLECTION);
      
      // 2. ドキュメントを追加 (addDocで自動ID生成)
      await addDoc(colRef, {
        name: name,
        questions: questions, // 配列をそのまま保存
        updatedAt: serverTimestamp(),
      });

      alert(`「${name}」を新規保存しました`);
      setSaveName('');
    } catch (e) {
      alert('保存に失敗しました。セキュリティルールを確認してください。');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 上書き先一覧を取得
  const openOverwriteList = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      const items = snapshot.docs.map((d) => ({ 
        id: d.id, 
        name: d.data().name ?? d.id 
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

  // 既存ドキュメントを上書き
  const overwrite = async (id, name) => {
    if (!window.confirm(`「${name}」を上書きしますか？`)) return;
    setLoading(true);
    try {
      // doc() で既存のIDを指定して setDoc で上書き
      await setDoc(doc(db, COLLECTION, id), {
        name,
        questions,
        updatedAt: serverTimestamp(),
      }, { merge: false }); // merge: false で完全に置き換え

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
        <button
          onClick={saveNew}
          className="btn btn-primary"
          disabled={loading || questions.length === 0}
        >
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
          <h6 className="small font-weight-bold">上書き先を選択:</h6>
          {existingSets.length === 0 ? (
            <p className="small text-muted">保存済みのデータはありません</p>
          ) : (
            existingSets.map((s) => (
              <button
                key={s.id}
                onClick={() => overwrite(s.id, s.name)}
                className="btn btn-sm btn-light w-100 mb-1 text-start border"
              >
                📁 {s.name}
              </button>
            ))
          )}
          <button
            onClick={() => setShowOverwriteList(false)}
            className="btn btn-sm btn-link w-100 text-muted"
          >
            キャンセル
          </button>
        </div>
      )}
    </div>
  );
};

export default FirebaseWriter;