import { createEmptyCard, State } from 'ts-fsrs';
import { estimateDeadlineWorkload } from './deadlineWorkload';

const now = new Date('2026-10-25T12:00:00');
const end = new Date('2026-10-26T23:59:59');
const options = { now, end, targetRetention: 0.9 };
const fresh = () => ({ tags: [], card: createEmptyCard(now) });

test('counts the initial answer and additional learning reviews, not just one per pending card', () => {
  const result = estimateDeadlineWorkload([fresh()], options);
  expect(result.good.remainingAnswers).toBeGreaterThan(1);
  expect(result.oneFailure.remainingAnswers).toBeGreaterThan(result.good.remainingAnswers);
  expect(result.good.answersPerDay).toBe(Math.ceil(result.good.remainingAnswers / 2));
});

test('counts repeated answers across all questions and respects tag scope', () => {
  const single = estimateDeadlineWorkload([fresh()], options);
  const questions = [{ ...fresh(), tags: ['a'] }, { ...fresh(), tags: ['b'] }];
  expect(estimateDeadlineWorkload(questions, options).good.remainingAnswers).toBe(single.good.remainingAnswers * 2);
  expect(estimateDeadlineWorkload(questions, { ...options, selectedTags: ['a'] }).good.remainingAnswers).toBe(single.good.remainingAnswers);
});

test('already-ready cards require zero further answers and simulation does not alter history', () => {
  const question = { tags: [], card: { ...createEmptyCard(now), reps: 3,
    state: State.Review, stability: 10000, difficulty: 5, last_review: now } };
  const original = JSON.stringify(question);
  const result = estimateDeadlineWorkload([question], options);
  expect(result.good.remainingAnswers).toBe(0);
  expect(result.oneFailure.remainingAnswers).toBe(0);
  expect(JSON.stringify(question)).toBe(original);
});

test('does not publish a total when learning waits extend beyond the deadline', () => {
  const result = estimateDeadlineWorkload([fresh()], { ...options, end: new Date(+now + 5 * 60000) });
  expect(result.good.remainingAnswers).toBeNull();
  expect(result.good.unresolved).toBe(1);
  expect(result.oneFailure.remainingAnswers).toBeNull();
});

test('invalid histories are reported and expired or invalid deadlines have no estimate', () => {
  expect(estimateDeadlineWorkload([{ card: null }], options).good.invalid).toBe(1);
  expect(estimateDeadlineWorkload([], { ...options, end: new Date(+now - 1) })).toBeNull();
  expect(estimateDeadlineWorkload([], { ...options, end: new Date('invalid') })).toBeNull();
});
