import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createEmptyCard } from 'ts-fsrs';
import Question from './Question';

jest.mock('./MultipleChoiceQuestion/MultipleChoiceQuestion', () => props => (
  <div>
    <span>{props.question.problem}</span>
    <button onClick={() => { props.setIsCorrect(true); props.setIsAnswered(true); props.setSelectedRating(require('ts-fsrs').Rating.Good); }}>Rate</button>
    <button onClick={() => {
      props.setIsAnswered(false); props.setSelectedRating(null); props.setNextQuestionIndex();
    }}>Next</button>
  </div>
));
jest.mock('./MultipleResponseQuestion/MultipleResponseQuestion', () => () => null);
jest.mock('./OrderingQuestion/OrderingQuestion', () => () => null);
jest.mock('./WordQuestion/WordQuestion', () => () => null);

function Quiz() {
  const [questions, setQuestions] = useState([
    { problem: 'New A', tags: [], card: createEmptyCard() },
    { problem: 'New B', tags: [], card: createEmptyCard() },
  ]);
  return <Question questions={questions} setQuestions={setQuestions} />;
}

beforeEach(() => localStorage.clear());

test('deadline mode persists answer counts but never treats the daily goal as a stop', () => {
  const view = render(<Quiz />);
  userEvent.click(screen.getByRole('button', { name: '期限付き' }));
  expect(screen.getByRole('button', { name: 'クイズを開始' })).toBeDisabled();
  const date = new Date();
  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  fireEvent.change(screen.getByLabelText('目標日'), { target: { value } });
  fireEvent.change(screen.getByLabelText('1日の回答数の目安'), { target: { value: '1' } });
  userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
  userEvent.click(screen.getByRole('button', { name: 'Rate' }));
  userEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.queryByText('今回の学習を終えました！')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Rate' })).toBeInTheDocument();
  expect(screen.getByText(/回答数の目安に達しましたが/)).toBeInTheDocument();
  view.unmount();
  render(<Quiz />);
  userEvent.click(screen.getByRole('button', { name: '期限付き' }));
  expect(screen.getByLabelText('目標日')).toHaveValue(value);
  userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
  expect(screen.getByRole('button', { name: 'Rate' })).toBeInTheDocument();
  expect(screen.getByText(/今日の回答 1 回/)).toBeInTheDocument();
});

test('a session ends after its configured new question budget is used', () => {
  render(<Quiz />);
  userEvent.click(screen.getByRole('button', { name: '長期記憶' }));
  const limit = screen.getByLabelText('今回の新規問題の上限');
  userEvent.clear(limit);
  userEvent.type(limit, '1');
  userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
  expect(screen.getByText('残り 1 問')).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: 'Rate' }));
  expect(screen.getByText('残り 0 問')).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('今回の学習を終えました！')).toBeInTheDocument();
});
