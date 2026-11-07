import { createEmptyCard, fsrs, Rating, State } from 'ts-fsrs';
import { deadlineReviewAt } from './deadlineSchedule';
import { getDeadlinePlan } from './deadlinePlan';

const now = new Date('2026-11-07T09:00:00');
const end = new Date('2026-12-06T23:59:59');
const model = fsrs({ enable_short_term: true, maximum_interval: 90 });

test('learning steps retain FSRS due and normal reviews no longer repeat every ten minutes', () => {
  const first = model.next(createEmptyCard(now), now, Rating.Good).card;
  const at = deadlineReviewAt(first, end);
  expect(+at - +now).toBe(600000);
  const review = model.next(first, at, Rating.Good).card;
  expect(review.state).toBe(State.Review);
  expect(deadlineReviewAt(review, end)).toEqual(review.due);
  expect(+deadlineReviewAt(review, end) - +at).toBeGreaterThanOrEqual(86400000);
});

test('normal reviews beyond deadline leave recovery time but never override minimum spacing', () => {
  const card = { ...createEmptyCard(now), reps: 3, state: State.Review, last_review: now, due: new Date('2027-01-01') };
  expect(+deadlineReviewAt(card, end)).toBe(+end - 86400000);
  expect(+deadlineReviewAt(card, new Date(+now + 300000))).toBe(+now + 600000);
});

test('a same-day deadline never schedules an otherwise eligible review at the expiry second', () => {
  const card = { ...createEmptyCard(now), reps: 3, state: State.Review,
    last_review: now, due: new Date('2027-01-01') };
  const tonight = new Date('2026-11-07T23:59:59');
  expect(+deadlineReviewAt(card, tonight)).toBe(+tonight - 600000);
});

test('one fresh card reaches a 30-day target without same-day normal review loops', () => {
  let card = createEmptyCard(now);
  let when = now;
  let answers = 0;
  while (answers < 20) {
    const plan = getDeadlinePlan([{ card, tags: [] }], { deadline: '2026-12-06', now: when });
    if (plan.status === 'target_met') break;
    if (!plan.candidates.length) {
      expect(plan.nextReviewAt).not.toBeNull();
      when = plan.nextReviewAt;
      continue;
    }
    card = model.next(card, when, Rating.Good).card;
    answers++;
  }
  expect(answers).toBeLessThanOrEqual(5);
  expect(getDeadlinePlan([{ card, tags: [] }], { deadline: '2026-12-06', now: when }).status).toBe('target_met');
});
