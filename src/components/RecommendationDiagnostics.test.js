import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { createEmptyCard } from 'ts-fsrs';
import RecommendationDiagnostics from './RecommendationDiagnostics';

test('opens live diagnostic table and filters problem text and reason', async () => {
  const now = new Date();
  const { container } = render(<RecommendationDiagnostics
    questions={['apple', 'banana'].map(problem => ({ problem, tags: [], card: createEmptyCard(now) }))}
    options={{ now, memoryMode: 'infinite' }} timeBlockedIndexes={[]} presented={{ 0: 3 }} currentIndex={0} />);
  const details = container.querySelector('details');
  details.open = true;
  fireEvent(details, new Event('toggle'));
  await screen.findByRole('region', { name: '出題の診断結果' });
  expect(screen.getAllByText('50.0%')).toHaveLength(2);
  expect(screen.getByText('#1（表示中）')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('問題・タグ検索'), { target: { value: 'banana' } });
  expect(screen.queryByText('apple')).not.toBeInTheDocument();
  expect(screen.getByText('banana')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('出題理由'), { target: { value: '次の出題候補' } });
  expect(screen.getByText('1 / 2 問')).toBeInTheDocument();
});

test('closed diagnostics do not access cards, including after closing and prop updates', async () => {
  const now = new Date();
  const readCard = jest.fn(() => createEmptyCard(now));
  const question = { problem: 'Deferred', tags: [], get card() { return readCard(); } };
  const props = { questions: [question], options: { now, memoryMode: 'infinite' },
    timeBlockedIndexes: [], presented: {} };
  const { container, rerender } = render(<RecommendationDiagnostics {...props} />);
  expect(readCard).not.toHaveBeenCalled();
  expect(screen.queryByRole('region', { name: '出題の診断結果' })).not.toBeInTheDocument();
  const details = container.querySelector('details');
  details.open = true;
  fireEvent(details, new Event('toggle'));
  await screen.findByRole('region', { name: '出題の診断結果' });
  expect(readCard).toHaveBeenCalled();
  details.open = false;
  fireEvent(details, new Event('toggle'));
  readCard.mockClear();
  rerender(<RecommendationDiagnostics {...props} options={{ ...props.options, now: new Date(+now + 10000) }} />);
  expect(readCard).not.toHaveBeenCalled();
  expect(screen.queryByRole('region', { name: '出題の診断結果' })).not.toBeInTheDocument();
});
