import React, { useState } from 'react';
import MultipleChoiceCreator from './MultipleChoiceQuestion/MultipleChoiceCreator';
import MultipleResponseCreator from './MultipleResponseQuestion/MultipleResponseCreator';
import OrderingCreator from './OrderingQuestion/OrderingCreator';
import WordQuestion from './WordQuestion/WordCreator';
import { QUESTION_TYPES, QUESTION_TYPE_LABELS } from '../constants/questionTypes';

const QUESTION_CREATORS = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: MultipleChoiceCreator,
  [QUESTION_TYPES.MULTIPLE_RESPONSE]: MultipleResponseCreator,
  [QUESTION_TYPES.ORDERING]: OrderingCreator,
  [QUESTION_TYPES.WORD]: WordQuestion,
};

const CreateQuestion = ({ questions, setQuestions }) => {
  const [questionType, setQuestionType] = useState(QUESTION_TYPES.MULTIPLE_CHOICE);
  const QCreator = QUESTION_CREATORS[questionType] || MultipleChoiceCreator;

  return (
    <div className="container mt-4">
      <div className="form-group mb-3">
        <select
          className="form-control"
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
        >
          {Object.entries(QUESTION_TYPE_LABELS).map(([type, label]) => (
            <option key={type} value={type}>{label}</option>
          ))}
        </select>
      </div>
      <div className="card p-4 shadow-sm">
        <QCreator questions={questions} setQuestions={setQuestions} />
      </div>
    </div>
  );
};

export default CreateQuestion;

