import { useState } from 'react';
import AnswerFeedback from '../AnswerFeedback';
import AnswerButton from '../AnswerButton';
import NextQuestionButton from '../NextQuestionButton';
import MarkdownArea from '../MarkdownArea';
import RatingButton from '../RatingButton';
import { Rating } from 'ts-fsrs';

const WordQuestion = ({ question, isCorrect, setIsCorrect, setNextQuestionIndex, isAnswered, setIsAnswered, selectedRating, setSelectedRating, memoryMode }) => {
  const [inputWord, setInputWord] = useState('');

  const correctWord = question.answer;

  const handleNextQuestion = () => {
    setInputWord('');
    setIsAnswered(false);
    setIsCorrect(false);
    setNextQuestionIndex();
  };

  const handleAnswer = () => {
    setIsAnswered(true);
    const correct = JSON.stringify(inputWord) === JSON.stringify(correctWord);
    setIsCorrect(correct);
    setSelectedRating(correct ? null : Rating.Again);
  };

  return (
    <div>
      {/* 問題文 */}
      <MarkdownArea text={question.problem}/>
      
      {/* 選択肢 */}
      
      <div className="mb-2">
        <input
          type="text"
          className="form-control w-full"
          placeholder={`解答を入力してください`}
          value={inputWord}
          onChange={(e) => {
            const newAnswer = e.target.value;
            setInputWord(newAnswer);
          }}
        />
      </div>
      
      {/* 正誤判定の表示 */}
      <AnswerFeedback explanation={question.explanation} isAnswered={isAnswered} isCorrect={isCorrect} />

      {/* 難易度評価ボタン */}
      { memoryMode !== 'infinite' && isAnswered && <RatingButton selectedRating={selectedRating} setSelectedRating={setSelectedRating} /> }

      {/* ボタン（回答 & 次の問題） */}
      <div className="d-flex justify-content-center gap-3 mt-4">
        <AnswerButton handleAnswer={handleAnswer} disabled={isAnswered || inputWord === ''} />
        <NextQuestionButton onNext={handleNextQuestion} disabled={!isAnswered || (!selectedRating && memoryMode !== 'infinite')} />
      </div>
    </div>
  );
};

export default WordQuestion;