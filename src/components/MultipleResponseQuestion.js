import React, { useState } from 'react';
import AnswerMRQ from './AnswerMRQ';
import AnswerFeedback from './AnswerFeedback';
import AnswerButton from './AnswerButton';
import NextQuestionButton from './NextQuestionButton';

const MultipleResponseQuestion = ({ question, isCorrect, setIsCorrect, setNextQuestionIndex, isAnswered, setIsAnswered }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);

  const correctOrder = question.answer;

  const checkAnswer = () => {
    setIsAnswered(true);
    setIsCorrect(JSON.stringify(selectedOptions) === JSON.stringify(correctOrder));
  };

  const handleSelect = (index) => {
    if (selectedOptions.includes(index)) {
      setSelectedOptions(selectedOptions.filter((item) => item !== index));
    } else {
      setSelectedOptions([...selectedOptions, index]);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOptions([]);
    setIsAnswered(false);
    setIsCorrect(false);
    setNextQuestionIndex();
  };

  return (
    <div>
      {/* 問題文 */}
      <h5 className="mb-4 text-center">{question.problem}</h5>
      
      {/* 選択肢 */}
      <div className="list-group">
        {question.options.map((option, index) => (
          <AnswerMRQ
            key={index}
						option={option}
						index={index}
						selectedOptions={selectedOptions}
						handleSelect={handleSelect}
            isAnswered={isAnswered}
					/>
        ))}
      </div>
      
      {/* 正誤判定の表示 */}
      <AnswerFeedback explanation={question.explanation} isAnswered={isAnswered} isCorrect={isCorrect} />

      {/* ボタン（回答 & 次の問題） */}
      <div className="d-flex justify-content-center gap-3 mt-4">
        <AnswerButton handleAnswer={checkAnswer} disabled={isAnswered || selectedOptions.length === 0} />
        <NextQuestionButton onNext={handleNextQuestion} disabled={!isAnswered} />
      </div>
    </div>
  );
};

export default MultipleResponseQuestion;