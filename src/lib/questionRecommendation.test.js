import { State } from 'ts-fsrs';
import { getQuestionQueue, selectQuestionIndex } from './questionRecommendation';

const now = new Date('2026-10-10T12:00:00Z');
const question = (reps, state = State.Review, due = '2026-10-09T12:00:00Z', tags = []) =>
  ({ card: { reps, state, due }, tags });
const options = { now, memoryMode: 'short' };

test('due learning and relearning precede reviews and new questions', () => {
  const questions = [question(0), question(2), question(1, State.Learning), question(3, State.Relearning)];
  expect(getQuestionQueue(questions, options)).toEqual({ candidates: [2, 3], count: 4 });
  expect(selectQuestionIndex(questions, options, () => 0.99)).toBe(3);
});

test('due reviews precede new questions without bringing future learning forward', () => {
  const questions = [question(0), question(1, State.Learning, '2026-10-11'), question(2)];
  expect(selectQuestionIndex(questions, options, () => 0)).toBe(2);
});

test('new questions obey the budget and remaining count', () => {
  const questions = [question(0), question(0), question(0)];
  expect(getQuestionQueue(questions, { ...options, newQuestionsRemaining: 2 }).count).toBe(2);
  expect(selectQuestionIndex(questions, { ...options, newQuestionsRemaining: 0 })).toBeNull();
});

test('exhausted new budget does not prevent relearning introduced questions', () => {
  expect(selectQuestionIndex([question(1, State.Relearning)],
    { ...options, newQuestionsRemaining: 0 })).toBe(0);
});

test('tag matching uses OR and excludes nonmatching due questions', () => {
  const questions = [question(2), question(0, State.New, undefined, ['b'])];
  expect(selectQuestionIndex(questions, { ...options, selectedTags: ['a', 'b'] })).toBe(1);
});

test('infinite mode ignores due dates and new question budget', () => {
  const questions = [question(0), question(2, State.Review, '2026-10-11')];
  expect(getQuestionQueue(questions, { ...options, memoryMode: 'infinite', newQuestionsRemaining: 0 }))
    .toEqual({ candidates: [0, 1], count: 2 });
});

test('empty queues and future reviews finish the session, due boundary is inclusive', () => {
  expect(selectQuestionIndex([], options)).toBeNull();
  expect(selectQuestionIndex([question(1, State.Review, '2026-10-11')], options)).toBeNull();
  expect(selectQuestionIndex([question(1, State.Review, now)], options)).toBe(0);
});
