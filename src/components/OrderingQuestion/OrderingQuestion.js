import React, { useState } from 'react';
import AnswerOrder from './AnswerOrder';
import AnswerFeedback from '../AnswerFeedback';
import AnswerButton from '../AnswerButton';
import NextQuestionButton from '../NextQuestionButton';
import MarkdownArea from '../MarkdownArea';

const OrderingQuestion = ({ question, isCorrect, setIsCorrect, setNextQuestionIndex, isAnswered, setIsAnswered }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);

  const correctOrder = question.answer;

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

  const handleAnswer = () => {
    setIsAnswered(true);
    setIsCorrect(JSON.stringify(selectedOptions) === JSON.stringify(correctOrder));
  };

  return (
    <div>
      {/* 問題文 */}
      <MarkdownArea text={question.problem}/>
      
      {/* 選択肢 */}
      <div className="list-group">
        {question.options.map((option, index) => (
          <AnswerOrder
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
        <AnswerButton handleAnswer={handleAnswer} disabled={isAnswered || selectedOptions.length === 0} />
        <NextQuestionButton onNext={handleNextQuestion} disabled={!isAnswered} />
      </div>
    </div>
  );
};

export default OrderingQuestion;