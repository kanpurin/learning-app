import { createEmptyCard, State } from 'ts-fsrs';
import { allocateReviewPlans, dateKey, reviewAlternatives } from './deadlineReviewPlanning';

const now = new Date('2026-10-10T12:00:00');
const end = new Date('2026-10-19T23:59:59');
const card = {
  ...createEmptyCard(now), reps: 3, stability: 2, difficulty: 5, state: State.Review,
  last_review: new Date('2026-10-08T12:00:00'), due: new Date('2026-10-11T12:00:00'),
};
const options = { now, end, targetRetention: 0.9 };
const items = count => Array.from({ length: count }, (_, index) => ({ index, question: { card } }));

test('lookahead considers both immediate and delayed, one- and two-review plans', () => {
  const alternatives = reviewAlternatives(card, options);
  expect(alternatives.some(plan => +plan.dates[0] === +now)).toBe(true);
  expect(alternatives.some(plan => plan.dates[0] > now)).toBe(true);
  expect(alternatives.some(plan => plan.dates.length === 2)).toBe(true);
  alternatives.forEach(plan => {
    expect(plan.gain).toBeGreaterThan(0);
    expect(plan.value).toBeLessThanOrEqual(0.9);
    expect(plan.dates.every(date => date >= now && date <= end)).toBe(true);
    if (plan.dates.length === 2) expect(dateKey(plan.dates[1]) > dateKey(plan.dates[0])).toBe(true);
  });
});

test('all scheduled first and second reviews share the daily answer capacity', () => {
  const result = allocateReviewPlans(items(6), { ...options, capacityForDay: () => 1 });
  const counts = {};
  result.scheduled.forEach(plan => plan.dates.forEach(date => {
    const day = dateKey(date);
    counts[day] = (counts[day] || 0) + 1;
  }));
  expect(result.scheduled.size).toBeGreaterThan(1);
  expect(Object.values(counts).every(count => count <= 1)).toBe(true);
  expect(result.scheduled.size + result.unplanned).toBe(6);
});

test('future capacity can shift reviews to today, exhausted capacity reports unplanned cards', () => {
  const result = allocateReviewPlans(items(2), {
    ...options, capacityForDay: date => dateKey(date) === dateKey(now) ? 1 : 0,
  });
  expect(result.today).toHaveLength(1);
  expect(result.unplanned).toBe(1);
  expect(allocateReviewPlans(items(2), { ...options, capacityForDay: () => 0 }).scheduled.size).toBe(0);
});

test('review plans are independent of question type and answer duration and do not mutate cards', () => {
  const original = JSON.stringify(card);
  const a = allocateReviewPlans([{ index: 0, question: { card, type: 'word', answerTime: 2 } }],
    { ...options, capacityForDay: () => 30 });
  const b = allocateReviewPlans([{ index: 0, question: { card, type: 'calculation', answerTime: 120 } }],
    { ...options, capacityForDay: () => 30 });
  expect(a).toEqual(b);
  expect(JSON.stringify(card)).toBe(original);
});

test('a card already at the deadline target needs no extra review', () => {
  expect(reviewAlternatives({ ...card, stability: 10000 }, options)).toEqual([]);
});
