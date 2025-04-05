import React, { useState } from 'react';
import MarkdownArea from '../MarkdownArea';
import TextEditModal from '../TextEditModal';
import AnswerOrder from './AnswerOrder';

const MultipleOrderEditor = ({ questions, setQuestions }) => {
  const [question, setQuestion] = useState({
    problem: '### 問題文',
    options: ['', '', '', '', ''],
    answer: [],
    explanation: '解説文'
  });

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

    const newQuestion = {
      ...question,
      options: filledOptions,
      type: 'order',
      attempts: 0,
      correctCount: 0,
      priority: 1.0,
      gap: 100
    };

    setQuestions([...questions, newQuestion]);
    alert('問題を保存しました');
  };

  return (
    <div>
      <div onClick={() => {
        setTempProblem(question.problem);
        setShowProblemModal(true);
      }}>
        <MarkdownArea text={question.problem || '### 問題文'} />
      </div>

      <div className="list-group">
        {question.options.map((option, index) => {
          const isDisabled = index > 0 && !question.options[index - 1].trim();
          const optionIndex = index + 1;
          const selectedIndex = question.answer.indexOf(optionIndex) + 1;

          return (
            <AnswerOrder
              key={index}
              option={option || `選択肢${optionIndex}`}
              optionIndex={optionIndex}
              selectedIndex={selectedIndex}
              onChange={(e) => {
                const selected = Number(e.target.value);
                setQuestion((prev) => {
                  console.log('selected:', selected);
                  if (prev.answer.includes(selected)) {
                    return {...prev, answer: prev.answer.filter(index => index !== selected)};
                  } else {
                    return {...prev, answer: [...prev.answer, optionIndex]};
                  }
                })
              }}
              onClick={() => {
                if (isDisabled) {
                  alert(`先に選択肢${index}を作成してください。`);
                  return;
                }
                setEditingOptionIndex(index);
                setTempOption(option);
                setShowOptionModal(true);
              }}
              disabled={!option.trim()}
            />
          )
        })}
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

export default MultipleOrderEditor;
