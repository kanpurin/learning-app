export function createDailyGoal({ dailyLimit, answersToday, newToday, remainingDays, workload, plan }) {
  const days = Math.max(1, remainingDays);
  const remainingAnswers = workload?.oneFailure?.remainingAnswers ?? workload?.good?.remainingAnswers;
  const required = remainingAnswers == null ? plan.minimumDailyAnswers
    : Math.ceil((answersToday + remainingAnswers) / days);
  return {
    answers: Math.max(dailyLimit, required),
    newQuestions: newToday + Math.ceil(plan.unseen / Math.max(1, days - 1)),
    estimated: remainingAnswers != null,
  };
}
