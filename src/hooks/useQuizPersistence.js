import { useEffect, useState } from 'react';
import Dexie from 'dexie';

const db = new Dexie('QuizAppDB');
db.version(1).stores({ store: '&key' });

const persistValue = (key, value) => {
  if (value === null) return;
  db.store.put({ key, value });
};

export const clearQuizPersistence = async () => {
  await db.store.clear();
};

export const useQuizPersistence = () => {
  const [questions, setQuestions] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [savedFlags, setSavedFlags] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const q = await db.store.get('questions');
      const f = await db.store.get('fileName');
      const t = await db.store.get('activeTab');
      const loadedQuestions = q?.value || [];

      setQuestions(loadedQuestions);
      setFileName(f?.value || 'questions_data');
      setActiveTab(t?.value || 'quiz');
      setSavedFlags(loadedQuestions.map(() => true));
    };

    loadData();
  }, []);

  useEffect(() => {
    persistValue('questions', questions);
  }, [questions]);

  useEffect(() => {
    persistValue('fileName', fileName);
  }, [fileName]);

  useEffect(() => {
    persistValue('activeTab', activeTab);
  }, [activeTab]);

  return {
    questions,
    setQuestions,
    fileName,
    setFileName,
    activeTab,
    setActiveTab,
    savedFlags,
    setSavedFlags,
  };
};

