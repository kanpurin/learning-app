import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const GoogleLogin = ({ onUserChange }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ログイン状態の監視
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (onUserChange) onUserChange(u);
    });
    return () => unsubscribe();
  }, [onUserChange]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Login failed:", e);
      alert("ログインに失敗しました");
    }
  };

  const handleLogout = () => signOut(auth);

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