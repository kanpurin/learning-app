import React, { useState } from 'react';
import AnswerMCQ from './AnswerMCQ';
import AnswerFeedback from '../AnswerFeedback';
import AnswerButton from '../AnswerButton';
import NextQuestionButton from '../NextQuestionButton';
import MarkdownArea from '../MarkdownArea';
import GradeButton from '../GradeButton';

const MultipleChoiceQuestion = ({ question, isCorrect, setIsCorrect, setNextQuestionIndex, isAnswered, setIsAnswered, selectedGrade, setSelectedGrade, memoryMode }) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const correctIndex = Number(question.answer[0]);

  const checkAnswer = (selectedIndex) => selectedIndex === correctIndex;

  // ラジオボタンの変更を処理
  const handleChange = (e) => {
    const selected = Number(e.target.value);
    setSelectedIndex(selected);
  };

  // 次の問題に進む処理
  const handleNextQuestion = () => {
    setSelectedIndex(-1);
    setIsAnswered(false);
    setIsCorrect(false);
    setSelectedGrade(null);
    setNextQuestionIndex();
  };

  // 回答ボタンの処理
  const handleAnswer = () => {
    setIsAnswered(true);
    const correct = checkAnswer(selectedIndex);
    setIsCorrect(correct);
    setSelectedGrade(correct ? (memoryMode === 'short' ? 2 : null) : 1);
  }

  return (
    <div>
      {/* 問題文 */}
      <MarkdownArea text={question.problem}/>

      {/* 選択肢 */}
      <div className="list-group">
        {question.options.map((option, index) => {
          const optionIndex = index + 1;
          return (
            <AnswerMCQ
              key={index}
              option={option}
              optionIndex={optionIndex}
              checked={selectedIndex === optionIndex}
              onChange={handleChange}
              disabled={isAnswered}
            />
          );
        })}
      </div>

      {/* 正誤判定の表示 */}
      <AnswerFeedback explanation={question.explanation} isAnswered={isAnswered} isCorrect={isCorrect} />

      {/* 難易度評価ボタン */}
      { isAnswered && memoryMode ==='long' && <GradeButton selectedGrade={selectedGrade} setSelectedGrade={setSelectedGrade} /> }

      {/* ボタン（回答 & 次の問題） */}
      <div className="d-flex justify-content-center gap-3 mt-4">
        <AnswerButton handleAnswer={handleAnswer} disabled={isAnswered || selectedIndex === -1} />
        <NextQuestionButton onNext={handleNextQuestion} disabled={!isAnswered || !selectedGrade} />
      </div>
    </div>
  );
};

export default MultipleChoiceQuestion;
