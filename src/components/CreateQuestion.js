import React, { useState } from 'react';
import MultipleChoiceCreator from './MultipleChoiceQuestion/MultipleChoiceCreator';
import MultipleResponseCreator from './MultipleResponseQuestion/MultipleResponseCreator';
import OrderingCreator from './OrderingQuestion/OrderingCreator';

const CreateQuestion = ({ questions, setQuestions }) => {
  const [questionType, setQuestionType] = useState('mcq');

  const QCreator = {
    mcq: MultipleChoiceCreator,
    mrq: MultipleResponseCreator,
    order: OrderingCreator
  }[questionType] || MultipleChoiceCreator;

  return (
    <div className="container mt-4">
      <div className="form-group mb-3">
        <select
          className="form-control"
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
        >
          <option value="mcq">単一選択問題</option>
          <option value="mrq">複数選択問題</option>
          <option value="order">並べ替え問題</option>
        </select>
      </div>
      <div className="card p-4 shadow-sm">
        <QCreator questions={questions} setQuestions={setQuestions} />
      </div>
      {/* {questions.length > 0 && (
          <div className="mt-4">
            <h5>作成済みの問題（{questions.length}件）</h5>
            <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', padding: '10px' }}>
              {JSON.stringify(questions, null, 2)}
            </pre>
          </div>
        )} */}
    </div>
  );
};

export default CreateQuestion;
