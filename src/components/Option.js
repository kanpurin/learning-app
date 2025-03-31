import React, { useState } from 'react';
import AnswerOption from './AnswerOption';
import AnswerFeedback from './AnswerFeedback';
import AnswerButtons from './AnswerButtons';

const Option = ({ question, isCorrect, setIsCorrect, setCurrentQuestionIndex, q_length }) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isAnswered, setIsAnswered] = useState(false);

  const correctIndex = Number(question.answer[0]);

  const checkAnswer = (selectedIndex) => selectedIndex === correctIndex;

  // ラジオボタンの変更を処理
  const handleChange = (e) => {
    const selected = Number(e.target.value);
    setSelectedIndex(selected);
    setIsCorrect(checkAnswer(selected));
  };

  // 次の問題に進む処理
  const handleNextQuestion = () => {
    setSelectedIndex(-1);
    setIsAnswered(false);
    setIsCorrect(false);
    setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % q_length);
  };

  // 回答ボタンの処理
  const handleAnswer = () => setIsAnswered(true);

  return (
    <div>
      {/* 問題文 */}
      <h5 className="mb-4 text-center">{question.problem}</h5>

      {/* 選択肢 */}
      <div className="list-group">
        {question.options.map((option, index) => {
          const optionIndex = index + 1;
          return (
            <AnswerOption
              key={index}
              option={option}
              optionIndex={optionIndex}
              selectedIndex={selectedIndex}
              isAnswered={isAnswered}
              handleChange={handleChange}
              isCorrect={isCorrect}
              correctIndex={correctIndex}
            />
          );
        })}
      </div>

      {/* 正誤判定の表示 */}
      <AnswerFeedback explanation= {question.explanation} isAnswered={isAnswered} isCorrect={isCorrect} />

      {/* ボタン（回答 & 次の問題） */}
      <AnswerButtons
        handleAnswer={handleAnswer}
        handleNextQuestion={handleNextQuestion}
        isAnswered={isAnswered}
        selectedIndex={selectedIndex}
      />
    </div>
  );
};

export default Option;
