import React, { useState, useEffect } from 'react';
import MarkdownArea from '../MarkdownArea';
import TextEditModal from '../TextEditModal';
import AnswerMCQ from './AnswerMCQ';

const MultipleChoiceEditor = ({ question, setQuestion, setIsSaved }) => {
  const [updatedQuestion, setUpdatedQuestion] = useState(question);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    setIsSaved(JSON.stringify(updatedQuestion) === JSON.stringify(question));
		// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedQuestion]);

  useEffect(() => {
    setUpdatedQuestion(question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  const addTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !updatedQuestion.tags.includes(newTag)) {
      setUpdatedQuestion({ ...updatedQuestion, tags: [...updatedQuestion.tags, newTag] });
    }
    setTagInput('');
  };
  
  const removeTag = (tagToRemove) => {
    setUpdatedQuestion({
      ...updatedQuestion,
      tags: updatedQuestion.tags.filter(tag => tag !== tagToRemove),
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
    const filledOptions = updatedQuestion.options.filter((opt) => opt.trim() !== '');

    if (filledOptions.length < 2) {
      alert('2つ以上の選択肢を入力してください');
      return;
    }
    if (question.answer.length === 0) {
      alert('正解の選択肢を選んでください');
      return;
    }
    if (question.options.some((option) => option.trim() === '')) {
      alert('選択肢に空欄が含まれています。すべての選択肢を入力してください');
      return;
    }

    setQuestion(updatedQuestion);
    setIsSaved(true);
    alert('問題を更新しました');
  };

  const addOption = () => {
    setUpdatedQuestion({ ...updatedQuestion, options: [...updatedQuestion.options, ''] });
  };

  return (
    <div>
      <div className="mb-3 border-bottom pb-2">
        <input
          type="text"
          className="form-control"
          style={{ borderRadius: '0', boxShadow: 'none' }}
          placeholder="問題のタイトル（summary）"
          value={updatedQuestion.summary}
          onChange={(e) => {
            const newSummary = e.target.value;
            setUpdatedQuestion(prev => ({ ...prev, summary: newSummary }));
          }}
        />
      </div>

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

      <div className="mt-3">
        <div className="d-flex flex-wrap gap-2 mb-2">
          {updatedQuestion.tags.map((tag, index) => (
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
        placeholder="### 問題文"
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
        placeholder="解説文"
        value={tempExplanation}
        onChange={setTempExplanation}
        onClose={() => setShowExplanationModal(false)}
        onSave={() => {
          setUpdatedQuestion({ ...updatedQuestion, explanation: tempExplanation });
          setShowExplanationModal(false);
        }}
        question={question}
      />

      <button className="btn btn-primary mt-3 me-2" onClick={handleSave}>
        保存
      </button>
      <button
        className="btn btn-secondary mt-3"
        onClick={() => setUpdatedQuestion(question)}
      >
        元に戻す
      </button>
    </div>
  );
};

export default MultipleChoiceEditor;
