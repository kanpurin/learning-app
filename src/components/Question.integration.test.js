import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createEmptyCard } from 'ts-fsrs';
import Question from './Question';

function Quiz({ initialCard = createEmptyCard(), initialQuestions }) {
  const [questions, setQuestions] = useState(initialQuestions || [{
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
  expect(screen.getByText('復習待ちです')).toBeInTheDocument();
});

test('a due failed question waits for five other answers while alternatives exist', () => {
  jest.useFakeTimers('modern');
  const random = jest.spyOn(Math, 'random').mockReturnValue(0);
  try {
    const initialQuestions = Array.from({ length: 7 }, (_, index) => ({
      type: 'mcq', problem: `Question ${index}`, options: ['Right', 'Wrong'], answer: [1],
      explanation: 'Explanation', tags: [], card: createEmptyCard(), random: false,
    }));
    render(<Quiz initialQuestions={initialQuestions} />);
    userEvent.click(screen.getByRole('button', { name: '短期記憶' }));
    userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
    userEvent.click(screen.getByRole('radio', { name: 'Wrong' }));
    userEvent.click(screen.getByRole('button', { name: '回答する' }));
    userEvent.click(screen.getByRole('button', { name: '次の問題' }));
    act(() => jest.advanceTimersByTime(10 * 60000));
    for (let i = 1; i <= 5; i += 1) {
      expect(screen.getByText(`Question ${i}`)).toBeInTheDocument();
      userEvent.click(screen.getByRole('radio', { name: 'Right' }));
      userEvent.click(screen.getByRole('button', { name: '回答する' }));
      userEvent.click(screen.getByRole('button', { name: '普通' }));
      userEvent.click(screen.getByRole('button', { name: '次の問題' }));
    }
    expect(screen.getByText('Question 0')).toBeInTheDocument();
  } finally {
    random.mockRestore();
    jest.useRealTimers();
  }
});

test.each(['短期記憶', '期限付き', '無限'])('%s waits ten minutes after an error and resumes automatically', mode => {
  jest.useFakeTimers('modern');
  try {
    render(<Quiz />);
    userEvent.click(screen.getByRole('button', { name: mode }));
    if (mode === '期限付き') {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      fireEvent.change(screen.getByLabelText('目標日'), { target: { value } });
    }
    userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
    userEvent.click(screen.getByRole('radio', { name: 'Wrong' }));
    userEvent.click(screen.getByRole('button', { name: '回答する' }));
    userEvent.click(screen.getByRole('button', { name: '次の問題' }));
    expect(screen.getByText('復習待ちです')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(9 * 60000));
    expect(screen.queryByText('Actual question')).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(60000));
    expect(screen.getByText('Actual question')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '回答する' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Wrong' })).not.toBeChecked();
  } finally { jest.useRealTimers(); }
});
