import { createEmptyCard, State } from 'ts-fsrs';
import { cardDate, normalizeFsrsCard, serializeFsrsCard } from './fsrsCard';
import { normalizeQuestion, serializeQuestion } from './questionData';

const due = new Date('2026-10-11T12:00:00.123Z');
const timestamp = { seconds: Math.floor(due.getTime() / 1000), nanoseconds: 123000000 };

test('supports Date, ISO, timestamp objects, and Firestore toDate instances', () => {
  [due, due.toISOString(), timestamp, { toDate: () => due }].forEach(value => {
    expect(cardDate(value)).toEqual(due);
  });
});

test('normalization retains reviewed history and does not mutate the original', () => {
  const card = { ...createEmptyCard(), due: timestamp, last_review: timestamp,
    reps: 5, lapses: 2, state: State.Review, stability: 8, difficulty: 6 };
  const normalized = normalizeFsrsCard(card);
  expect(normalized).toEqual({ ...card, due, last_review: due });
  expect(card.due).toBe(timestamp);
  expect(serializeFsrsCard(card)).toEqual({ ...card, due: due.toISOString(), last_review: due.toISOString() });
});

test('Firebase save and load dates stay portable without losing history', () => {
  const question = normalizeQuestion({ problem: 'test', card: {
    ...createEmptyCard(), due: timestamp, last_review: timestamp, reps: 3,
  } });
  expect(question.card.due).toEqual(due);
  const saved = serializeQuestion(question);
  expect(saved.card.due).toBe(due.toISOString());
  expect(saved.card.reps).toBe(3);
  expect(normalizeQuestion(JSON.parse(JSON.stringify(saved))).card).toEqual(question.card);
});
