import React, { useState } from 'react';
import AnswerMRQ from './AnswerMRQ';
import AnswerFeedback from '../AnswerFeedback';
import AnswerButton from '../AnswerButton';
import NextQuestionButton from '../NextQuestionButton';
import MarkdownArea from '../MarkdownArea';
import RatingButton from '../RatingButton';
import { Rating } from 'ts-fsrs';

const MultipleResponseQuestion = ({ question, optionOrder, isCorrect, setIsCorrect, setNextQuestionIndex, isAnswered, setIsAnswered, selectedRating, setSelectedRating, memoryMode }) => {
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
    setSelectedRating(null);
    setNextQuestionIndex();
  };

  // 回答ボタンの処理
  const handleAnswer = () => {
    setIsAnswered(true);
    const correct = checkAnswer(selectedIndices);
    setIsCorrect(correct);
    setSelectedRating(correct ? null : Rating.Again);
  }

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
            return (
              <AnswerMRQ
                key={i}
                option={question.options[index]}
                optionIndex={optionIndex}
                checked={selectedIndices.includes(optionIndex)}
                onChange={handleChange}
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
        <AnswerButton handleAnswer={handleAnswer} disabled={isAnswered || selectedIndices.length === 0} />
        <NextQuestionButton onNext={handleNextQuestion} disabled={!isAnswered || (!selectedRating && memoryMode !== 'infinite')} />
      </div>
    </div>
  );
};

export default MultipleResponseQuestion;
