import React, { useState } from 'react';
import AnswerOrder from './AnswerOrder';
import AnswerFeedback from '../AnswerFeedback';
import AnswerButton from '../AnswerButton';
import NextQuestionButton from '../NextQuestionButton';
import MarkdownArea from '../MarkdownArea';
import GradeButton from '../GradeButton';

const OrderingQuestion = ({ question, isCorrect, setIsCorrect, setNextQuestionIndex, isAnswered, setIsAnswered, selectedGrade, setSelectedGrade, memoryMode }) => {
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
    setSelectedGrade(correct ? (memoryMode === 'short' ? 2 : null) : 1);
  };

  return (
    <div>
      {/* 問題文 */}
      <MarkdownArea text={question.problem}/>
      
      {/* 選択肢 */}
      <div className="list-group">
        {question.options.map((option, index) => {
          const optionIndex = index + 1;
          const selectedIndex = selectedOptions.indexOf(optionIndex) + 1;
          return (
            <AnswerOrder
              key={index}
              option={option}
              optionIndex={optionIndex}
              selectedIndex={selectedIndex}
              onChange={() => handleSelect(optionIndex)}
              disabled={isAnswered}
            />
          )
      })}
      </div>
      
      {/* 正誤判定の表示 */}
      <AnswerFeedback explanation={question.explanation} isAnswered={isAnswered} isCorrect={isCorrect} />

      {/* 難易度評価ボタン */}
      { isAnswered && memoryMode ==='long' && <GradeButton selectedGrade={selectedGrade} setSelectedGrade={setSelectedGrade} /> }

      {/* ボタン（回答 & 次の問題） */}
      <div className="d-flex justify-content-center gap-3 mt-4">
        <AnswerButton handleAnswer={handleAnswer} disabled={isAnswered || selectedOptions.length === 0} />
        <NextQuestionButton onNext={handleNextQuestion} disabled={!isAnswered || !selectedGrade} />
      </div>
    </div>
  );
};

export default OrderingQuestion;