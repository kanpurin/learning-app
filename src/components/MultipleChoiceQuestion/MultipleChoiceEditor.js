import React, { useState } from 'react';
import MarkdownArea from '../MarkdownArea';
import TextEditModal from '../TextEditModal';
import AnswerMCQ from './AnswerMCQ';

const MultipleChoiceEditor = ({ question, setQuestion }) => {
  const [updatedQuestion, setUpdatedQuestion] = useState(question);

  const [showProblemModal, setShowProblemModal] = useState(false);
  const [tempProblem, setTempProblem] = useState('');

  const [showOptionModal, setShowOptionModal] = useState(false);
  const [editingOptionIndex, setEditingOptionIndex] = useState(null);
  const [tempOption, setTempOption] = useState('');

  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [tempExplanation, setTempExplanation] = useState('');

  const handleSave = () => {
    const filledOptions = updatedQuestion.options.filter((opt) => opt.trim() !== '');

    if (!updatedQuestion.problem.trim()) {
      alert('問題文を入力してください');
      return;
    }
    if (filledOptions.length < 2) {
      alert('2つ以上の選択肢を入力してください');
      return;
    }
    if (updatedQuestion.answer.length === 0) {
      alert('正解の選択肢を選んでください');
      return;
    }
    if (!updatedQuestion.explanation.trim()) {
      alert('解説文を入力してください');
      return;
    }
    if (updatedQuestion.options.some((option) => option.trim() === '')) {
      alert('選択肢に空欄が含まれています。すべての選択肢を入力してください');
      return;
    }

    setQuestion(updatedQuestion);
    alert('問題を更新しました');
  };

  const addOption = () => {
    setUpdatedQuestion({ ...updatedQuestion, options: [...updatedQuestion.options, ''] });
  };

  return (
    <div>
      <div onClick={() => {
        setTempProblem(updatedQuestion.problem);
        setShowProblemModal(true);
      }}>
        <MarkdownArea text={updatedQuestion.problem || '### 問題文'} />
      </div>

      <div className="list-group">
        {updatedQuestion.options.map((option, index) => {
          const optionIndex = index + 1;
          return (
            <AnswerMCQ
              key={index}
              option={option || `選択肢${optionIndex}`}
              optionIndex={optionIndex}
              checked={updatedQuestion.answer.includes(optionIndex)}
              onChange={() => setUpdatedQuestion({ ...updatedQuestion, answer: [optionIndex] })}
              onClick={() => {
                setEditingOptionIndex(index);
                setTempOption(option);
                setShowOptionModal(true);
              }}
              onDelete={(deleteIndex) => {
                const newOptions = updatedQuestion.options.filter((_, i) => i !== deleteIndex);
                const newAnswer = updatedQuestion.answer
                  .filter((ans) => ans !== deleteIndex + 1)
                  .map((ans) => (ans > deleteIndex + 1 ? ans - 1 : ans));
                setUpdatedQuestion({ ...updatedQuestion, options: newOptions, answer: newAnswer });
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
        className="alert mt-3 alert-success"
        role="alert"
        onClick={() => {
          setTempExplanation(updatedQuestion.explanation);
          setShowExplanationModal(true);
        }}
      >
        <MarkdownArea text={updatedQuestion.explanation || '解説文'} />
      </div>

      <TextEditModal
        show={showProblemModal}
        title="問題文の編集"
        value={tempProblem}
        onChange={setTempProblem}
        onClose={() => setShowProblemModal(false)}
        onSave={() => {
          setUpdatedQuestion({ ...updatedQuestion, problem: tempProblem });
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
          const newOptions = [...updatedQuestion.options];
          newOptions[editingOptionIndex] = tempOption;
          setUpdatedQuestion({ ...updatedQuestion, options: newOptions });
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
          setUpdatedQuestion({ ...updatedQuestion, explanation: tempExplanation });
          setShowExplanationModal(false);
        }}
      />

      <button className="btn btn-primary mt-3" onClick={handleSave}>
        保存
      </button>
    </div>
  );
};

export default MultipleChoiceEditor;
