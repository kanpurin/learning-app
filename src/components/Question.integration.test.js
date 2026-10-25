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

function setDeadlineForToday() {
  const date = new Date();
  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  fireEvent.change(screen.getByLabelText('目標日'), { target: { value } });
}

test('daily progress is separate from total pending items and extra learning is opt-in', () => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date('2026-10-25T12:00:00'));
  let view;
  try {
    const initialQuestions = Array.from({ length: 2 }, (_, i) => ({
      type: 'mcq', problem: `Daily ${i}`, options: ['Right', 'Wrong'], answer: [1],
      explanation: 'Explanation', tags: [], card: createEmptyCard(), random: false,
    }));
    const scope = JSON.stringify([[], initialQuestions.map(q => [q.problem, q.tags])]);
    const key = JSON.stringify([scope, '2026-10-25']);
    localStorage.setItem('learning-app-deadline-plan', JSON.stringify({
      deadline: '2026-10-26', dailyLimit: 1, targetRetention: 0.9,
      ledger: { [key]: { answers: 0, newCount: 0, goal: { answers: 1, newQuestions: 1,
        estimated: true, config: JSON.stringify(['2026-10-26', 0.9, 1]) } } },
    }));
    view = render(<Quiz initialQuestions={initialQuestions} />);
    userEvent.click(screen.getByRole('button', { name: '期限付き' }));
    userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
    expect(screen.getByText('完了 0 回答・あと 1 回答')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '残り 2 問' })).not.toBeInTheDocument();
    expect(screen.getByText('期限までの全体進捗').closest('details')).not.toHaveAttribute('open');
    userEvent.click(screen.getByRole('radio', { name: 'Right' }));
    userEvent.click(screen.getByRole('button', { name: '回答する' }));
    userEvent.click(screen.getByRole('button', { name: '普通' }));
    expect(screen.getByRole('heading', { name: '今日の目標 1 回答' })).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: '次の問題' }));
    expect(screen.getByText('今日の目標を達成しました')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(10 * 60000));
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: '追加学習する' }));
    expect(screen.getByRole('radio', { name: 'Right' })).toBeEnabled();
    view.unmount();
    view = render(<Quiz initialQuestions={initialQuestions} />);
    userEvent.click(screen.getByRole('button', { name: '期限付き' }));
    userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
    expect(screen.getByText('今日の目標を達成しました')).toBeInTheDocument();
    jest.setSystemTime(new Date('2026-10-26T12:00:00'));
    act(() => jest.advanceTimersByTime(10000));
    expect(screen.getByText(/完了 0 回答・あと/)).toBeInTheDocument();
    expect(screen.queryByText('今日の目標を達成しました')).not.toBeInTheDocument();
  } finally {
    view?.unmount();
    jest.useRealTimers();
  }
});

test('deadline mode continues beyond the daily goal with real answer controls', () => {
  const initialQuestions = Array.from({ length: 2 }, (_, i) => ({
    type: 'mcq', problem: `Pending ${i}`, options: ['Right', 'Wrong'], answer: [1],
    explanation: 'Explanation', tags: [], card: createEmptyCard(), random: false,
  }));
  render(<Quiz initialQuestions={initialQuestions} />);
  userEvent.click(screen.getByRole('button', { name: '期限付き' }));
  setDeadlineForToday();
  fireEvent.change(screen.getByLabelText('1日の回答数の目安'), { target: { value: '1' } });
  userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
  userEvent.click(screen.getByRole('radio', { name: 'Right' }));
  userEvent.click(screen.getByRole('button', { name: '回答する' }));
  userEvent.click(screen.getByRole('button', { name: '普通' }));
  userEvent.click(screen.getByRole('button', { name: '次の問題' }));
  expect(screen.getByRole('radio', { name: 'Right' })).toBeEnabled();
  expect(screen.getByText(/目安に達しましたが/)).toBeInTheDocument();
  expect(screen.getByLabelText('必要回答数の試算')).toBeInTheDocument();
  expect(screen.getByText(/今後すべて「普通」で正答：残り約/)).toBeInTheDocument();
  expect(screen.queryByText('今回の学習を終えました！')).not.toBeInTheDocument();
});

test('deadline target message is explicitly a forecast and requires all cards ready', () => {
  const card = { ...createEmptyCard(), reps: 3, state: 2, stability: 10000, difficulty: 5,
    last_review: new Date(Date.now() - 86400000) };
  render(<Quiz initialCard={card} />);
  userEvent.click(screen.getByRole('button', { name: '期限付き' }));
  setDeadlineForToday();
  userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
  expect(screen.getByText('全問が目標記憶率以上です（推定）')).toBeInTheDocument();
  expect(screen.getByText(/期限当日の全問正答を保証/)).toBeInTheDocument();
});

test('an active deadline session explicitly reports unmet cards at expiry', () => {
  jest.useFakeTimers('modern');
  try {
    render(<Quiz />);
    userEvent.click(screen.getByRole('button', { name: '期限付き' }));
    setDeadlineForToday();
    userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
    jest.setSystemTime(new Date(Date.now() + 86400000));
    act(() => jest.advanceTimersByTime(10000));
    expect(screen.getByText('目標日を過ぎました')).toBeInTheDocument();
    expect(screen.getByText('未達の問題が 1 問残っています。')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '回答する' })).not.toBeInTheDocument();
  } finally { jest.useRealTimers(); }
});

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
