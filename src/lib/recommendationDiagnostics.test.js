import { createEmptyCard, State } from 'ts-fsrs';
import { getRecommendationDiagnostics } from './recommendationDiagnostics';
import { getQuestionQueue } from './questionRecommendation';
import { getDeadlinePlan } from './deadlinePlan';

const now = new Date('2026-11-07T12:00:00');
const question = (card = {}, tags = ['a']) => ({ problem: 'test', tags, card: { ...createEmptyCard(now), ...card } });
const options = { now, memoryMode: 'short', blockedIndexes: [], selectedTags: [] };

test('diagnostic probabilities use actual queue and identify due reviews waiting for their slot', () => {
  const questions = [question({ reps: 1, state: State.Learning }), question({ reps: 2, state: State.Review }), question()];
  const rows = getRecommendationDiagnostics(questions, options);
  expect(rows.filter(row => row.probability).map(row => row.index)).toEqual(getQuestionQueue(questions, options).candidates);
  expect(rows[1].reason).toBe('他の出題枠を先に出題');
  expect(rows[1].overdue).toBe(true);
  expect(rows[0].probability).toBe(1);
});

test('diagnostics distinguish group rotation from exposure rotation', () => {
  const questions = [question({ reps: 2, state: State.Review }), question({ reps: 2, state: State.Review })];
  const rows = getRecommendationDiagnostics(questions, { ...options, answeredCount: 1, presented: { 0: 3, 1: 1 } });
  expect(rows[0].reason).toBe('今回の出題回数が少ない問題を先に出題');
  expect(rows[1].probability).toBe(1);
});

test('fallback waives answer-count block, never time block', () => {
  const questions = [question(), question()];
  const rows = getRecommendationDiagnostics(questions, { ...options, blockedIndexes: [0, 1] }, { timeBlockedIndexes: [1] });
  expect(rows[0].probability).toBe(1);
  expect(rows[1].reason).toBe('再出題の間隔・他問題の回答待ち');
});

test('deadline diagnostics match actual selected plan, including strict retry block', () => {
  const questions = [question(), question(), question({}, ['b'])];
  const opts = { ...options, memoryMode: 'deadline', selectedTags: ['a'], deadline: '2026-11-20', blockedIndexes: [0] };
  const plan = getDeadlinePlan(questions, opts);
  const rows = getRecommendationDiagnostics(questions, opts, { plan });
  expect(rows.filter(row => row.probability).map(row => row.index)).toEqual(plan.candidates);
  expect(rows[0].reason).toBe('再出題の間隔・他問題の回答待ち');
  expect(rows[2].reason).toBe('タグ対象外');
  expect(getRecommendationDiagnostics(questions, opts, { plan, checkpoint: true })[1].probability).toBe(0);
});

test('future due, new limit, invalid deadline and equal random chances', () => {
  expect(getRecommendationDiagnostics([question({ reps: 2, due: new Date(now.getTime() + 100000) })], options)[0].reason).toBe('FSRS復習予定前');
  expect(getRecommendationDiagnostics([question()], { ...options, newQuestionsRemaining: 0 })[0].reason).toBe('今回の新規上限に到達');
  expect(getRecommendationDiagnostics([question()], { ...options, memoryMode: 'deadline' })[0].reason).toBe('目標日未設定');
  expect(getRecommendationDiagnostics([question(), question()], { ...options, memoryMode: 'infinite' }).map(row => row.probability)).toEqual([0.5, 0.5]);
});
