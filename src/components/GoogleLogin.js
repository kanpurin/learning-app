import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { firebaseAuth, googleProvider } from '../lib/firebaseApp';

const GoogleLogin = ({ onUserChange }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ログイン状態の監視
    const unsubscribe = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      if (onUserChange) onUserChange(u);
    });
    return () => unsubscribe();
  }, [onUserChange]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
    } catch (e) {
      console.error("Login failed:", e);
      alert("ログインに失敗しました");
    }
  };

  const handleLogout = () => signOut(firebaseAuth);

  return (
    <div className="mb-4">
      {user ? (
        <button onClick={handleLogout} className="btn btn-sm btn-outline-danger">
          ログアウト
        </button>
      ) : (
        <button onClick={handleLogin} className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center gap-2">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: '18px' }} />
          Googleでログイン
        </button>
      )}
    </div>
  );
};

export default GoogleLogin;
