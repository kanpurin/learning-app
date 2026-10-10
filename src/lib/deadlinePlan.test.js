import { createEmptyCard, fsrs, Rating, State } from 'ts-fsrs';
import { getDeadlinePlan, recallAt } from './deadlinePlan';

const now = new Date('2026-10-10T12:00:00');
const options = { now, deadline: '2026-10-19', startedOn: '2026-10-10', dailyLimit: 30 };
const fresh = () => ({ problem: 'new', tags: [], card: createEmptyCard(now) });
const learned = (due, state = State.Review) => ({ tags: [], card: {
  ...createEmptyCard(now), reps: 3, stability: 2, difficulty: 5, state,
  last_review: new Date('2026-10-08T12:00:00'), due: new Date(due),
} });

test('new introductions reserve the last fifth of the calendar window', () => {
  const plan = getDeadlinePlan(Array.from({ length: 80 }, fresh), options);
  expect(plan.newGoal).toBe(10);
  expect(plan.newRemaining).toBe(10);
  expect(plan.count).toBe(10);
});

test('daily introductions are not reset when reopening after partial progress', () => {
  const plan = getDeadlinePlan(Array.from({ length: 77 }, fresh), {
    ...options, today: { answers: 3, newCount: 3 },
  });
  expect(plan.newGoal).toBe(10);
  expect(plan.newRemaining).toBe(7);
});

test('new slots cannot be consumed entirely by a review backlog', () => {
  const plan = getDeadlinePlan([fresh(), learned('2026-10-09')], {
    ...options, dailyLimit: 2, today: { answers: 1, newCount: 0 },
  });
  expect(plan.candidates).toEqual([0]);
});

test('due relearning is prioritized while review slots remain', () => {
  expect(getDeadlinePlan([fresh(), learned('2026-10-09', State.Relearning)], options).candidates).toEqual([1]);
});

test('a risk can be deferred when a later review has better expected benefit', () => {
  const item = learned('2026-10-20');
  const plan = getDeadlinePlan([item], options);
  expect(plan.candidates).toEqual([]);
  expect(plan.plannedReviews).toBe(1);
  expect(plan.nextReviewDate).not.toBeNull();
});

test('deadline-day risks can be reviewed early but not repeatedly on that day', () => {
  const item = learned('2026-10-20');
  item.card.stability = 1;
  const finalDay = { ...options, deadline: '2026-10-10' };
  expect(getDeadlinePlan([item], finalDay).candidates).toEqual([0]);
  item.card.last_review = now;
  expect(getDeadlinePlan([item], finalDay).candidates).toEqual([]);
});

test('daily budget stops selection and invalid or past deadlines are rejected', () => {
  expect(getDeadlinePlan([fresh()], { ...options, today: { answers: 30, newCount: 0 } }).candidates).toEqual([]);
  expect(getDeadlinePlan([], { ...options, deadline: '' })).toBeNull();
  expect(getDeadlinePlan([], { ...options, deadline: '2026-10-09' })).toBeNull();
});

test('prediction uses the installed FSRS model and counts unseen as zero', () => {
  const item = learned('2026-10-20');
  expect(recallAt(item.card, now)).toBe(fsrs().get_retrievability(item.card, now, false));
  expect(recallAt(fresh().card, now)).toBe(0);
  expect(recallAt(item.card, new Date('2026-10-19T12:00:00'))).toBeLessThan(recallAt(item.card, now));
});

test('tag selection and future learning dates are respected', () => {
  const item = learned('2026-10-20', State.Learning);
  item.tags = ['a'];
  expect(getDeadlinePlan([item, fresh()], { ...options, selectedTags: ['a'] }).candidates).toEqual([]);
});

test('FSRS review outcomes remain valid inputs to the deadline planner', () => {
  const card = fsrs().next(createEmptyCard(now), now, Rating.Good).card;
  expect(getDeadlinePlan([{ card, tags: [] }], options).predictedRetention).toBeGreaterThan(0);
});

test('an insufficient daily introduction budget is reported', () => {
  expect(getDeadlinePlan(Array.from({ length: 80 }, fresh), { ...options, dailyLimit: 5 }).overloaded).toBe(true);
});

test('missed days increase the new question goal', () => {
  expect(getDeadlinePlan(Array.from({ length: 80 }, fresh), {
    ...options, now: new Date('2026-10-17T12:00:00'),
  }).newGoal).toBe(80);
});
