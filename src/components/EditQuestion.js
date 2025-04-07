import React, { useState } from 'react';
import MultipleChoiceEditor from './MultipleChoiceQuestion/MultipleChoiceEditor';
import MultipleResponseEditor from './MultipleResponseQuestion/MultipleResponseEditor';
import OrderingEditor from './OrderingQuestion/OrderingEditor';

const EditQuestion = ({ questions, setQuestions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const editQuestion = (q, index) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = q;
      return updated;
    });
  };

  const getQEditor = (question, index) => {
    const QEditor = {
      mcq: MultipleChoiceEditor,
      mrq: MultipleResponseEditor,
      order: OrderingEditor
    }[question.type] || MultipleChoiceEditor;
    console.log(questions[index]);
    console.log(question);

    return (
      <QEditor
        key={index}
        question={question}
        setQuestion={(q) => editQuestion(q, index)}
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
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {q.summary ? <>q.summary</> : <>質問 {index + 1}（{q.type}</>}
              </button>
            </h2>
            <div
              className={`accordion-collapse collapse ${currentQuestionIndex === index ? 'show' : ''}`}
            >
              <div className="accordion-body">
                {getQEditor(q, index)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditQuestion;
