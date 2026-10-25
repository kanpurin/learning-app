import { createDailyGoal } from './dailyGoal';

const options = {
  dailyLimit: 30, answersToday: 0, newToday: 0, remainingDays: 5,
  workload: { oneFailure: { remainingAnswers: 200 }, good: { remainingAnswers: 100 } },
  plan: { minimumDailyAnswers: 10, unseen: 80 },
};

test('uses the workload estimate instead of the number of all unseen items', () => {
  expect(createDailyGoal(options)).toEqual({ answers: 40, newQuestions: 20, estimated: true });
});

test('retains the user daily goal when it is sufficient', () => {
  expect(createDailyGoal({ ...options, dailyLimit: 60 }).answers).toBe(60);
});

test('includes work already completed today when creating a new daily goal', () => {
  expect(createDailyGoal({ ...options, answersToday: 10, newToday: 3 })).toEqual({
    answers: 42, newQuestions: 23, estimated: true,
  });
});

test('falls back explicitly when the retry scenario or both estimates are unavailable', () => {
  expect(createDailyGoal({ ...options, workload: {
    oneFailure: { remainingAnswers: null }, good: { remainingAnswers: 300 },
  } }).answers).toBe(60);
  expect(createDailyGoal({ ...options, workload: null })).toEqual({
    answers: 30, newQuestions: 20, estimated: false,
  });
});
