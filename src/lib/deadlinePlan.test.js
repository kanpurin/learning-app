import { createEmptyCard, fsrs, Rating, State } from 'ts-fsrs';
import { getDeadlinePlan, recallAt } from './deadlinePlan';

const now = new Date('2026-10-10T12:00:00');
const options = { now, deadline: '2026-10-19', startedOn: '2026-10-10', dailyLimit: 30 };
const fresh = () => ({ problem: 'new', tags: [], card: createEmptyCard(now) });
const learned = (due, state = State.Review) => ({ tags: [], card: {
  ...createEmptyCard(now), reps: 3, stability: 2, difficulty: 5, state,
  last_review: new Date('2026-10-08T12:00:00'), due: new Date(due),
} });

test('all unseen items remain available immediately regardless of the daily goal', () => {
  const plan = getDeadlinePlan(Array.from({ length: 80 }, fresh), options);
  expect(plan.newGoal).toBe(80);
  expect(plan.newRemaining).toBe(80);
  expect(plan.count).toBe(80);
  expect(plan.candidates).toHaveLength(80);
});

test('daily introductions are not reset when reopening after partial progress', () => {
  const plan = getDeadlinePlan(Array.from({ length: 77 }, fresh), {
    ...options, today: { answers: 3, newCount: 3 },
  });
  expect(plan.newGoal).toBe(80);
  expect(plan.newRemaining).toBe(77);
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

test('a large relearning backlog cannot indefinitely starve unseen questions', () => {
  expect(getDeadlinePlan([fresh(), learned('2026-10-09', State.Relearning)], {
    ...options, today: { answers: 1, newCount: 0 },
  }).candidates).toEqual([0]);
});

test('normal reviews receive slots after the planned daily introductions are answered', () => {
  expect(getDeadlinePlan([fresh(), learned('2026-10-09')], {
    ...options, newQuestionGoal: 2, today: { answers: 4, newCount: 2 },
  }).candidates).toEqual([1]);
});

test('weak cards are not deferred just because the FSRS due date is after the deadline', () => {
  const item = learned('2026-10-20');
  const plan = getDeadlinePlan([item], options);
  expect(plan.candidates).toEqual([0]);
  expect(plan.count).toBe(1);
  expect(plan.status).toBe('studying');
});

test('deadline-day risks can be reviewed early but not repeatedly on that day', () => {
  const item = learned('2026-10-20');
  item.card.stability = 1;
  const finalDay = { ...options, deadline: '2026-10-10' };
  expect(getDeadlinePlan([item], finalDay).candidates).toEqual([0]);
  item.card.last_review = now;
  expect(getDeadlinePlan([item], finalDay).candidates).toEqual([]);
});

test('daily goal never stops learning and expired deadlines explicitly report failure', () => {
  const plan = getDeadlinePlan([fresh()], { ...options, today: { answers: 30, newCount: 0 } });
  expect(plan.candidates).toEqual([0]);
  expect(plan.exceededDailyGoal).toBe(true);
  expect(getDeadlinePlan([], { ...options, deadline: '' })).toBeNull();
  expect(getDeadlinePlan([fresh()], { ...options, deadline: '2026-10-09' })).toMatchObject({ status: 'expired', count: 1, candidates: [] });
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

test('only every individual reviewed card meeting the target can finish the goal', () => {
  const strong = learned('2026-11-01');
  strong.card.stability = 10000;
  expect(getDeadlinePlan([strong], options)).toMatchObject({ status: 'target_met', count: 0, ready: 1 });
  const mixed = getDeadlinePlan([strong, fresh()], options);
  expect(mixed).toMatchObject({ status: 'studying', count: 1, ready: 1 });
  expect(getDeadlinePlan([], options).status).toBe('empty');
});

test('a high retention forecast does not mark a learning card as mastered', () => {
  const item = learned('2026-10-11', State.Relearning);
  item.card.stability = 10000;
  expect(getDeadlinePlan([item], options)).toMatchObject({ status: 'waiting', count: 1, ready: 0 });
});

test('the planner retains same-day weak reviews and resumes them after spacing', () => {
  const item = learned('2026-11-01');
  item.card.last_review = now;
  const plan = getDeadlinePlan([item], options);
  expect(plan).toMatchObject({ status: 'waiting', count: 1 });
  expect(plan.nextReviewAt).toEqual(new Date(+now + 600000));
  expect(getDeadlinePlan([item], { ...options, now: new Date(+now + 600000) }).candidates).toEqual([0]);
});

test('late failed items remain unmet and cannot be silently counted as complete', () => {
  const item = learned('2026-10-20', State.Relearning);
  expect(getDeadlinePlan([item], options)).toMatchObject({
    status: 'waiting', count: 1, cannotRetryBeforeDeadline: true,
  });
});
