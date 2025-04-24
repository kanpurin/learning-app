import React, { useState } from 'react';
import AnswerOrder from './AnswerOrder';
import AnswerFeedback from '../AnswerFeedback';
import AnswerButton from '../AnswerButton';
import NextQuestionButton from '../NextQuestionButton';
import MarkdownArea from '../MarkdownArea';
import RatingButton from '../RatingButton';
import { Rating } from 'ts-fsrs';

const OrderingQuestion = ({ question, optionOrder, isCorrect, setIsCorrect, setNextQuestionIndex, isAnswered, setIsAnswered, selectedRating, setSelectedRating, memoryMode }) => {
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
    const correct = JSON.stringify(selectedOptions) === JSON.stringify(correctOrder);
    setIsCorrect(correct);
    setSelectedRating(correct ? null : Rating.Again);
  };

  return (
    <div>
      {/* 問題文 */}
      <MarkdownArea text={question.problem}/>
      
      {/* 選択肢 */}
      <div className="list-group">
        {(question.random 
          ? optionOrder 
          : question.options.map((_, i) => i)).map((index, i) => {
            const optionIndex = index + 1;
            const selectedIndex = selectedOptions.indexOf(optionIndex) + 1;
            return (
              <AnswerOrder
                key={i}
                option={question.options[index]}
                optionIndex={optionIndex}
                selectedIndex={selectedIndex}
                onChange={() => handleSelect(optionIndex)}
                disabled={isAnswered}
              />
            );
      })}
      </div>
      
      {/* 正誤判定の表示 */}
      <AnswerFeedback explanation={question.explanation} isAnswered={isAnswered} isCorrect={isCorrect} />

      {/* 難易度評価ボタン */}
      { memoryMode !== 'infinite' && isAnswered && <RatingButton selectedRating={selectedRating} setSelectedRating={setSelectedRating} /> }

      {/* ボタン（回答 & 次の問題） */}
      <div className="d-flex justify-content-center gap-3 mt-4">
        <AnswerButton handleAnswer={handleAnswer} disabled={isAnswered || selectedOptions.length === 0} />
        <NextQuestionButton onNext={handleNextQuestion} disabled={!isAnswered || (!selectedRating && memoryMode !== 'infinite')} />
      </div>
    </div>
  );
};

export default OrderingQuestion;