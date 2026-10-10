import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createEmptyCard } from 'ts-fsrs';
import Question from './Question';

function Quiz({ initialCard = createEmptyCard() }) {
  const [questions, setQuestions] = useState([{
    type: 'mcq', problem: 'Actual question', options: ['Right', 'Wrong'],
    answer: [1], explanation: 'Actual explanation', tags: [], random: false,
    card: initialCard,
  }]);
  return <Question questions={questions} setQuestions={setQuestions} />;
}

test('real question renders and can be answered, rated and completed', () => {
  render(<Quiz />);
  userEvent.click(screen.getByRole('button', { name: '長期記憶' }));
  userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
  expect(screen.getByText('Actual question')).toBeInTheDocument();
  userEvent.click(screen.getByRole('radio', { name: 'Right' }));
  userEvent.click(screen.getByRole('button', { name: '回答する' }));
  expect(screen.getByText('Actual explanation')).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '普通' }));
  userEvent.click(screen.getByRole('button', { name: /次/ }));
  expect(screen.getByText('今回の学習を終えました！')).toBeInTheDocument();
});

test('deadline mode accepts a card loaded with Firestore timestamp dates', () => {
  const card = createEmptyCard();
  card.due = { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
  render(<Quiz initialCard={card} />);
  userEvent.click(screen.getByRole('button', { name: '期限付き' }));
  const date = new Date();
  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  fireEvent.change(screen.getByLabelText('目標日'), { target: { value } });
  userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
  userEvent.click(screen.getByRole('radio', { name: 'Right' }));
  userEvent.click(screen.getByRole('button', { name: '回答する' }));
  userEvent.click(screen.getByRole('button', { name: '普通' }));
  expect(screen.getByText('Actual explanation')).toBeInTheDocument();
});

beforeEach(() => localStorage.clear());

test.each(['Right', 'Wrong'])('deadline mode handles a real %s answer', answer => {
  render(<Quiz />);
  userEvent.click(screen.getByRole('button', { name: '期限付き' }));
  const date = new Date();
  date.setDate(date.getDate() + 14);
  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  fireEvent.change(screen.getByLabelText('目標日'), { target: { value } });
  userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
  userEvent.click(screen.getByRole('radio', { name: answer }));
  userEvent.click(screen.getByRole('button', { name: '回答する' }));
  expect(screen.getByText('Actual explanation')).toBeInTheDocument();
  if (answer === 'Right') userEvent.click(screen.getByRole('button', { name: '普通' }));
  userEvent.click(screen.getByRole('button', { name: '次の問題' }));
  expect(screen.getByText('今回の学習を終えました！')).toBeInTheDocument();
});
