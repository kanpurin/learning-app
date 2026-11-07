import { simulateStudy } from './recommendationSimulation';
import { createEmptyCard, Rating, State } from 'ts-fsrs';

test.each([false, true])('deadline simulation reaches all cards with first failures=%s', firstAttemptFails => {
  const result = simulateStudy({ count: 40, firstAttemptFails });
  expect(result.ready).toBe(40);
  expect(result.unseen).toBe(0);
  expect(result.answers).toBeLessThan(300);
  expect(result.retentionAtDeadline).toBeGreaterThanOrEqual(0.9);
  expect(result.events.every(event => event.day <= result.horizonDays)).toBe(true);
});

test.each(['short', 'deadline'])('%s mixes due reviews and new cards into a persistent relearning backlog', memoryMode => {
  const start = new Date('2026-11-07T00:00:00');
  const initialCards = Array.from({ length: 90 }, (_, index) => index >= 75 ? createEmptyCard(start) : {
    ...createEmptyCard(start), reps: 3, state: index < 60 ? State.Relearning : State.Review,
    stability: index < 60 ? 0.4 : 2, difficulty: 8,
    last_review: new Date(+start - 86400000), due: start,
  });
  const result = simulateStudy({ count: 90, start, memoryMode, initialCards,
    ratingFor: (index, attempt) => index < 60 && attempt <= 2 ? Rating.Again : Rating.Good });
  const groups = result.events.slice(0, 30).reduce((counts, event) => ({ ...counts, [event.group]: (counts[event.group] || 0) + 1 }), {});
  expect(groups.learning).toBe(10);
  expect(groups.review).toBeGreaterThanOrEqual(9);
  expect(groups.new).toBeGreaterThanOrEqual(9);
  expect(result.unseen).toBe(0);
  expect(result.events.every(event => event.day <= result.horizonDays)).toBe(true);
});

test('single card requires spaced reviews, not hundreds of same-day repetitions', () => {
  const result = simulateStudy({ count: 1 });
  expect(result.ready).toBe(1);
  expect(result.answers).toBeLessThanOrEqual(5);
  expect(result.events[2].day - result.events[1].day).toBeGreaterThanOrEqual(1);
});

test('short mode is deterministic and completes a multi-card run without starving unseen questions', () => {
  const result = simulateStudy({ count: 40, memoryMode: 'short' });
  expect(result.unseen).toBe(0);
  expect(result.answers).toBeGreaterThan(40);
  expect(simulateStudy({ count: 40, memoryMode: 'short' }).answerCounts).toEqual(result.answerCounts);
});
