import { fsrs, createEmptyCard, Rating, State } from 'ts-fsrs';
import { getDeadlinePlan, deadlineDate, localDate, recallAt } from './deadlinePlan';
import { getQuestionQueue } from './questionRecommendation';
import { createDailyGoal } from './dailyGoal';
import { estimateDeadlineWorkload } from './deadlineWorkload';
import { answerSpacing, blockedRetries, delayRetry } from './retrySpacing';
import { normalizeFsrsCard } from './fsrsCard';

// An idealized learner answers immediately when eligible, up to each day's goal.
// No answer duration is used by the recommendation or the memory model.
export function simulateStudy({
  count = 1, start = new Date('2026-11-07T00:00:00'), deadline = '2026-12-06',
  dailyLimit = 30, targetRetention = 0.9, memoryMode = 'deadline',
  firstAttemptFails = false, planFor = getDeadlinePlan, spacingFor = answerSpacing,
  queueForMode = getQuestionQueue, initialCards = [], ratingFor,
}) {
  const end = deadlineDate(deadline);
  const model = fsrs({ enable_short_term: memoryMode !== 'long', maximum_interval: 90 });
  const questions = Array.from({ length: count }, (_, index) => ({
    problem: `Question ${index + 1}`, tags: [], card: initialCards[index]
      ? normalizeFsrsCard(initialCards[index]) : createEmptyCard(start),
  }));
  const retries = {};
  const events = [];
  const shown = Array(count).fill(0);
  const previousAnswer = Array(count).fill(null);
  const gaps = [];
  let answers = 0;
  let firstTargetAt = null;
  let seed = 12345;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    let now = new Date(day);
    const today = { answers: 0, newCount: 0 };
    const initial = planFor(questions, { deadline, targetRetention, now, today });
    const goal = memoryMode === 'deadline' ? createDailyGoal({ dailyLimit, answersToday: 0,
      newToday: 0, remainingDays: Math.max(1, Math.ceil((end - now) / 86400000)),
      workload: estimateDeadlineWorkload(questions, { now, end, targetRetention }), plan: initial,
    }) : { answers: dailyLimit };
    while (today.answers < goal.answers && now <= end && localDate(now) === localDate(day)) {
      const options = { deadline, targetRetention, now, today, memoryMode,
        answeredCount: answers, presented: shown,
        newQuestionGoal: goal.newQuestions, newQuestionsRemaining: count,
        blockedIndexes: blockedRetries(retries, answers, now) };
      const queueFor = blockedIndexes => memoryMode === 'deadline'
        ? planFor(questions, { ...options, blockedIndexes })
        : queueForMode(questions, { ...options, blockedIndexes });
      let queue = queueFor(options.blockedIndexes);
      if (!queue.candidates.length) queue = queueFor(blockedRetries(retries, answers, now, true));
      if (memoryMode === 'deadline' && queue.status === 'target_met') {
        firstTargetAt = firstTargetAt || new Date(now);
        break;
      }
      if (!queue.candidates.length) {
        const times = questions.flatMap((question, index) => {
          const retry = retries[index];
          return [retry?.notBefore, memoryMode === 'deadline'
            ? queue.assessed?.find(item => item.index === index && !item.ready)?.availableAt
            : question.card.reps ? +question.card.due : null];
        }).filter(value => Number.isFinite(value) && value > +now);
        if (!times.length) break;
        now = new Date(Math.min(...times));
        continue;
      }
      const index = queue.candidates[Math.floor(random() * queue.candidates.length)];
      const before = questions[index].card;
      const rating = ratingFor ? ratingFor(index, shown[index] + 1)
        : firstAttemptFails && before.reps === 0 ? Rating.Again : Rating.Good;
      let card = model.next(before, now, rating).card;
      if (rating === Rating.Again) card = delayRetry(card, now);
      questions[index].card = card;
      answers++;
      today.answers++;
      if (!before.reps) today.newCount++;
      shown[index]++;
      const spacing = spacingFor(memoryMode, rating !== Rating.Again, answers, now);
      if (spacing) retries[index] = spacing;
      if (previousAnswer[index] !== null) gaps.push(answers - previousAnswer[index] - 1);
      previousAnswer[index] = answers;
      events.push({ index, answer: answers, day: (now - start) / 86400000, rating, card,
        group: before.reps === 0 ? 'new' : [State.Learning, State.Relearning].includes(before.state) ? 'learning' : 'review' });
    }
  }
  const ready = questions.filter(question => question.card.reps > 0 &&
    question.card.state === State.Review && recallAt(question.card, end) >= targetRetention).length;
  return { memoryMode, count, answers, ready, unseen: shown.filter(value => !value).length,
    firstTargetDay: firstTargetAt ? (firstTargetAt - start) / 86400000 : null,
    retentionAtDeadline: questions.reduce((sum, question) => sum + recallAt(question.card, end), 0) / count,
    answerCounts: shown, minimumInterveningAnswers: gaps.length ? Math.min(...gaps) : null,
    events, horizonDays: (end - start) / 86400000 };
}
