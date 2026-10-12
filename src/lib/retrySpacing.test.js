import { createEmptyCard, State } from 'ts-fsrs';
import { blockedRetries, delayRetry, RETRY_WAIT_MS } from './retrySpacing';
import { getQuestionQueue } from './questionRecommendation';
import { getDeadlinePlan } from './deadlinePlan';

const now = new Date('2026-10-12T12:00:00');

test('an error is postponed ten minutes without shortening a longer FSRS interval', () => {
  const card = { ...createEmptyCard(now), due: new Date(+now + 60000) };
  expect(delayRetry(card, now).due).toEqual(new Date(+now + RETRY_WAIT_MS));
  const later = { ...card, due: new Date(+now + 86400000) };
  expect(delayRetry(later, now).due).toEqual(later.due);
  expect(card.due).toEqual(new Date(+now + 60000));
});

test('both time and intervening answers are required unless there are no alternatives', () => {
  const retries = { 2: { notBefore: +now + RETRY_WAIT_MS, afterAnswers: 6 } };
  expect(blockedRetries(retries, 6, now)).toEqual([2]);
  const ready = new Date(+now + RETRY_WAIT_MS);
  expect(blockedRetries(retries, 5, ready)).toEqual([2]);
  expect(blockedRetries(retries, 6, ready)).toEqual([]);
  expect(blockedRetries(retries, 1, ready, true)).toEqual([]);
  expect(blockedRetries(retries, 6, now, true)).toEqual([2]);
});

test('blocked relearning does not prevent other due reviews and new cards', () => {
  const questions = [
    { tags: [], card: { ...createEmptyCard(now), reps: 1, state: State.Relearning } },
    { tags: [], card: createEmptyCard(now) },
  ];
  expect(getQuestionQueue(questions, { now, blockedIndexes: [0] }).candidates).toEqual([1]);
  expect(getQuestionQueue(questions, { now, memoryMode: 'infinite', blockedIndexes: [0] }).candidates).toEqual([1]);
  expect(getDeadlinePlan(questions, { now, deadline: '2026-10-13', blockedIndexes: [0] }).candidates).toEqual([1]);
});
