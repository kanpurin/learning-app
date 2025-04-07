import React, { useState } from 'react';
import MultipleChoiceEditor from './MultipleChoiceQuestion/MultipleChoiceEditor';
import MultipleResponseEditor from './MultipleResponseQuestion/MultipleResponseEditor';
import OrderingEditor from './OrderingQuestion/OrderingEditor';

const EditQuestion = ({ questions, setQuestions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [savedFlags, setSavedFlags] = useState(questions.map(() => true));

  const editQuestion = (q, index) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = q;
      return updated;
    });
  };

  const deleteQuestion = (index) => {
    const confirmDelete = window.confirm(`問題 ${index + 1} を削除してもよろしいですか？`);
    if (!confirmDelete) return;

    setQuestions(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });

    setCurrentQuestionIndex(prev => {
      if (index === prev && prev > 0) return prev - 1;
      if (index < prev) return prev - 1;
      return prev;
    });
  };

  const getQEditor = (question, index) => {
    const QEditor = {
      mcq: MultipleChoiceEditor,
      mrq: MultipleResponseEditor,
      order: OrderingEditor
    }[question.type] || MultipleChoiceEditor;

    return (
      <QEditor
        key={index}
        question={question}
        setQuestion={(q) => editQuestion(q, index)}
        setIsSaved={(b) => 
          setSavedFlags(prev => {
            const updated = [...prev];
            updated[index] = b;
            return updated;
          })
        }
      />
    );
  };

  return (
    <div className="container mt-4">
      <div className="accordion" id="questionAccordion">
        {questions.map((q, index) => (
          <div className="accordion-item" key={index}>
            <h2 className="accordion-header">
              <button
                className={`accordion-button ${currentQuestionIndex === index ? '' : 'collapsed'}`}
                type="button"
                onClick={() => setCurrentQuestionIndex(prev => prev === index ? null : index)}
              >
                {(!savedFlags[index] ? '*' : '') + `問題 ${index + 1}　` + q.summary}
              </button>
            </h2>
            <div
              className={`accordion-collapse collapse ${currentQuestionIndex === index ? 'show' : ''}`}
            >
              <div className="accordion-body">
                {getQEditor(q, index)}
                <div className="text-end mt-3">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteQuestion(index)}
                  >
                    この問題を削除
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <div className="alert alert-info mt-3">問題がありません。</div>
        )}
      </div>
    </div>
  );
};

export default EditQuestion;
