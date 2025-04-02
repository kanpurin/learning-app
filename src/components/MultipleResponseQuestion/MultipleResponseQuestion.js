import React, { useState } from 'react';
import AnswerMRQ from './AnswerMRQ';
import AnswerFeedback from '../AnswerFeedback';
import AnswerButton from '../AnswerButton';
import NextQuestionButton from '../NextQuestionButton';

const MultipleResponseQuestion = ({ question, isCorrect, setIsCorrect, setNextQuestionIndex, isAnswered, setIsAnswered }) => {
  const [selectedIndices, setSelectedIndices] = useState([]);

  const correctIndices = question.answer

  const checkAnswer = (selectedIndices) => {
    return selectedIndices.every(index => correctIndices.includes(index)) &&
           selectedIndices.length === correctIndices.length;
  };

  // ラジオボタンの変更を処理
  const handleChange = (e) => {
    const selected = Number(e.target.value);
    setSelectedIndices(prev => {
      if (prev.includes(selected)) {
        return prev.filter(index => index !== selected);  // 既に選ばれていれば削除
      } else {
        return [...prev, selected];  // 新たに選ばれた場合は追加
      }
    });
  };

  // 次の問題に進む処理
  const handleNextQuestion = () => {
    setSelectedIndices([]);
    setIsAnswered(false);
    setIsCorrect(false);
    setNextQuestionIndex();
  };

  // 回答ボタンの処理
  const handleAnswer = () => {
    setIsAnswered(true);
    setIsCorrect(checkAnswer(selectedIndices));
  }

  return (
    <div>
      {/* 問題文 */}
      <h5 className="mb-4 text-center">{question.problem}</h5>

      {/* 選択肢 */}
      <div className="list-group">
        {question.options.map((option, index) => {
          const optionIndex = index + 1;
          return (
            <AnswerMRQ
              key={index}
              option={option}
              optionIndex={optionIndex}
              selectedIndices={selectedIndices}
              isAnswered={isAnswered}
              handleChange={handleChange}
            />
          );
        })}
      </div>

      {/* 正誤判定の表示 */}
      <AnswerFeedback explanation={question.explanation} isAnswered={isAnswered} isCorrect={isCorrect} />

      {/* ボタン（回答 & 次の問題） */}
      <div className="d-flex justify-content-center gap-3 mt-4">
        <AnswerButton handleAnswer={handleAnswer} disabled={isAnswered || selectedIndices.length === 0} />
        <NextQuestionButton onNext={handleNextQuestion} disabled={!isAnswered} />
      </div>
    </div>
  );
};

export default MultipleResponseQuestion;
