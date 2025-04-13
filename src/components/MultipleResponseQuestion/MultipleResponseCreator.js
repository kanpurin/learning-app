import React, { useState } from 'react';
import MarkdownArea from '../MarkdownArea';
import TextEditModal from '../TextEditModal';
import AnswerMRQ from './AnswerMRQ';

const MultipleResponseCreator = ({ questions, setQuestions }) => {
  const [tagInput, setTagInput] = useState('');
  const [question, setQuestion] = useState({
    summary: '',
    problem: '### 問題文',
    options: ['', ''],
    answer: [],
    explanation: '解説文',
    tags: [],
  });

  const addTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !question.tags.includes(newTag)) {
      setQuestion({ ...question, tags: [...question.tags, newTag] });
    }
    setTagInput('');
  };
  
  const removeTag = (tagToRemove) => {
    setQuestion({
      ...question,
      tags: question.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const [showProblemModal, setShowProblemModal] = useState(false);
  const [tempProblem, setTempProblem] = useState('');

  const [showOptionModal, setShowOptionModal] = useState(false);
  const [editingOptionIndex, setEditingOptionIndex] = useState(null);
  const [tempOption, setTempOption] = useState('');
  
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [tempExplanation, setTempExplanation] = useState('');

  const handleSave = () => {
    const filledOptions = question.options.filter((opt) => opt.trim() !== '');

    if (!question.problem.trim()) {
      alert('問題文を入力してください');
      return;
    }
    if (filledOptions.length < 2) {
      alert('2つ以上の選択肢を入力してください');
      return;
    }
    if (question.answer.length === 0) {
      alert('正解の選択肢を選んでください');
      return;
    }
    if (!question.explanation.trim()) {
      alert('解説文を入力してください');
      return;
    }
    if (question.options.some((option) => option.trim() === '')) {
      alert('選択肢に空欄が含まれています。すべての選択肢を入力してください');
      return;
    }

    const newQuestion = {
      ...question,
      options: filledOptions,
      type: 'mrq',
      attempts: 0,
      correctCount: 0,
      priority: 1.0,
      gap: 100,
      deleted: false,
      stability: null,
      difficulty: null,
      lastAnsweredDate: null,
    };

    setQuestions([...questions, newQuestion]);
    alert('問題を保存しました');
  };

  const addOption = () => {
    setQuestion({ ...question, options: [...question.options, ''] });
  };

  return (
    <div>
      <div className="mb-3 border-bottom pb-2">
        <input
          type="text"
          className="form-control"
          style={{ borderRadius: '0', boxShadow: 'none' }}
          placeholder="問題のタイトル（summary）"
          value={question.summary}
          onChange={(e) => {
            const newSummary = e.target.value;
            setQuestion(prev => ({ ...prev, summary: newSummary }));
          }}
        />
      </div>

      <div onClick={() => {
        setTempProblem(question.problem);
        setShowProblemModal(true);
      }}>
        <MarkdownArea text={question.problem || '### 問題文'} />
      </div>

      <div className="list-group">
        {question.options.map((option, index) => {
          const optionIndex = index + 1;
          return (
            <AnswerMRQ
              key={index}
              option={option || `選択肢${optionIndex}`}
              optionIndex={optionIndex}
              checked={question.answer.includes(optionIndex)}
              onChange={(e) => {
                const selected = Number(e.target.value);
                setQuestion((prev) => {
                  if (prev.answer.includes(selected)) {
                    return {...prev, answer: prev.answer.filter(index => index !== selected)};
                  } else {
                    return {...prev, answer: [...prev.answer, optionIndex]};
                  }
                })
              }}
              onClick={() => {
                setEditingOptionIndex(index);
                setTempOption(option);
                setShowOptionModal(true);
              }}
              onDelete={(deleteIndex) => {
                const newOptions = question.options.filter((_, i) => i !== deleteIndex);
                const newAnswer = question.answer
                  .filter((ans) => ans !== deleteIndex + 1)
                  .map((ans) => (ans > deleteIndex + 1 ? ans - 1 : ans));
                setQuestion({ ...question, options: newOptions, answer: newAnswer });
              }}
              disabled={!option.trim()}
            />
          )
        })}
        <button
          className="list-group-item list-group-item-action text-center text-primary"
          onClick={addOption}
        >
          ＋ 選択肢を追加
        </button>
      </div>

      <div 
        className={`alert mt-3 alert-success`} 
        role="alert" 
        onClick={() => {
          setTempExplanation(question.explanation);
          setShowExplanationModal(true);
        }}
      >
        <MarkdownArea text={question.explanation || '解説文'} />
      </div>

      <div className="mt-3">
        <div className="d-flex flex-wrap gap-2 mb-2">
          {question.tags.map((tag, index) => (
            <span
              key={index}
              className="badge bg-light text-dark border d-flex align-items-center"
              style={{ padding: '0.5em 0.75em', fontSize: '0.9em' }}
            >
              {tag}
              <button
                type="button"
                className="btn-close btn-sm ms-2"
                aria-label="Remove"
                onClick={() => removeTag(tag)}
                style={{ fontSize: '0.6em' }}
              />
            </span>
          ))}
        </div>

        <input
          type="text"
          className="form-control"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="タグを入力して Enter"
        />
      </div>

      <TextEditModal
        show={showProblemModal}
        title="問題文の編集"
        value={tempProblem}
        onChange={setTempProblem}
        onClose={() => setShowProblemModal(false)}
        onSave={() => {
          setQuestion({ ...question, problem: tempProblem });
          setShowProblemModal(false);
        }}
      />

      <TextEditModal
        show={showOptionModal}
        title={`選択肢 ${editingOptionIndex + 1} の編集`}
        value={tempOption}
        onChange={setTempOption}
        onClose={() => setShowOptionModal(false)}
        onSave={() => {
          const newOptions = [...question.options];
          newOptions[editingOptionIndex] = tempOption;
          setQuestion({ ...question, options: newOptions });
          setShowOptionModal(false);
        }}
      />

      <TextEditModal
        show={showExplanationModal}
        title="解説文の編集"
        value={tempExplanation}
        onChange={setTempExplanation}
        onClose={() => setShowExplanationModal(false)}
        onSave={() => {
          setQuestion({ ...question, explanation: tempExplanation });
          setShowExplanationModal(false);
        }}
      />

      <button className="btn btn-primary mt-3" onClick={handleSave}>
        保存
      </button>
    </div>
  );
};

export default MultipleResponseCreator;
