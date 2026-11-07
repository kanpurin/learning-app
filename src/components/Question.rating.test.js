import React, { StrictMode, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createEmptyCard, fsrs, Rating } from 'ts-fsrs';
import Question from './Question';
import { delayRetry } from '../lib/retrySpacing';

const now = new Date('2026-11-07T12:00:00');

function TrackedQuiz({ type = 'mcq' }) {
  const [questions, setQuestions] = useState([{
    type, problem: 'Rating test', options: ['Right', 'Wrong'],
    answer: type === 'word' ? 'Right' : type === 'order' ? [1, 2] : [1],
    explanation: 'Explanation', tags: [], random: false, card: createEmptyCard(now),
  }]);
  return <><output data-testid="card">{JSON.stringify(questions[0].card)}</output>
    <Question questions={questions} setQuestions={setQuestions} /></>;
}

function start(mode = '短期記憶', type = 'mcq') {
  render(<StrictMode><TrackedQuiz type={type} /></StrictMode>);
  userEvent.click(screen.getByRole('button', { name: mode }));
  if (mode === '期限付き') fireEvent.change(screen.getByLabelText('目標日'), { target: { value: '2026-11-20' } });
  userEvent.click(screen.getByRole('button', { name: 'クイズを開始' }));
}

function answer(type, correct) {
  if (type === 'word') fireEvent.change(screen.getByRole('textbox'), { target: { value: correct ? 'Right' : 'Wrong' } });
  else if (type === 'order') {
    const labels = correct ? ['Right', 'Wrong'] : ['Wrong', 'Right'];
    labels.forEach(label => userEvent.click(screen.getByText(label)));
  } else userEvent.click(screen.getByRole(type === 'mcq' ? 'radio' : 'checkbox', { name: correct ? 'Right' : 'Wrong' }));
  userEvent.click(screen.getByRole('button', { name: '回答する' }));
}

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers('modern');
  jest.setSystemTime(now);
});
afterEach(() => jest.useRealTimers());

test.each(['mcq', 'mrq', 'order', 'word'].flatMap(type => [true, false].map(correct => [type, correct])))('%s correct=%s: rating remains editable and only the final rating is saved once', (type, correct) => {
  start('短期記憶', type);
  const original = screen.getByTestId('card').textContent;
  answer(type, correct);
  if (!correct) expect(screen.getByRole('button', { name: 'もう一回' })).toHaveAttribute('aria-pressed', 'true');
  for (const name of ['普通', '難しい', 'もう一回', '簡単']) {
    const button = screen.getByRole('button', { name });
    expect(button).toBeEnabled();
    userEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('card').textContent).toBe(original);
  }
  userEvent.click(screen.getByRole('button', { name: '次の問題' }));
  const actual = JSON.parse(screen.getByTestId('card').textContent);
  const expected = fsrs({ enable_short_term: true, maximum_interval: 90 }).next(createEmptyCard(now), now, Rating.Easy).card;
  expect(actual).toEqual(JSON.parse(JSON.stringify(expected)));
  expect(actual.reps).toBe(1);
});

test.each(['短期記憶', '長期記憶', '期限付き'])('%s commits Again only on Next and does not count intermediate selections', mode => {
  start(mode);
  answer('mcq', true);
  expect(screen.getByRole('button', { name: '次の問題' })).toBeDisabled();
  userEvent.click(screen.getByRole('button', { name: '簡単' }));
  userEvent.click(screen.getByRole('button', { name: 'もう一回' }));
  expect(JSON.parse(screen.getByTestId('card').textContent).reps).toBe(0);
  if (mode === '期限付き') expect(screen.getByText(/完了 0 回答/)).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '次の問題' }));
  const expected = fsrs({ enable_short_term: mode !== '長期記憶', maximum_interval: 90 }).next(createEmptyCard(now), now, Rating.Again).card;
  expect(JSON.parse(screen.getByTestId('card').textContent)).toEqual(JSON.parse(JSON.stringify(delayRetry(expected, now))));
  expect(screen.getByText('復習待ちです')).toBeInTheDocument();
  if (mode === '期限付き') expect(screen.getByText(/完了 1 回答/)).toBeInTheDocument();
});

test('infinite mode advances without a rating and never changes the card', () => {
  start('無限');
  const original = screen.getByTestId('card').textContent;
  answer('mcq', false);
  expect(screen.queryByRole('button', { name: 'もう一回' })).not.toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: '次の問題' }));
  expect(screen.getByTestId('card').textContent).toBe(original);
  expect(screen.getByText('復習待ちです')).toBeInTheDocument();
});
