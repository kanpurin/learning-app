import { State } from 'ts-fsrs';
import { allocateReviewPlans, predictRecall } from './deadlineReviewPlanning';
import { normalizeFsrsCard } from './fsrsCard';

const DAY = 86400000;

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function deadlineDate(value) {
  return new Date(`${value}T23:59:59`);
}

export function recallAt(card, date) {
  return predictRecall(card, date);
}

export function getDeadlinePlan(questions, {
  deadline, targetRetention = 0.9, dailyLimit = 30, selectedTags = [],
  startedOn = localDate(), now = new Date(), today = { answers: 0, newCount: 0 },
  blockedIndexes = [],
}) {
  const end = deadlineDate(deadline);
  if (!Number.isFinite(end.getTime()) || end < now) return null;
  const matching = questions.map((question, index) => ({ question: {
    ...question, card: normalizeFsrsCard(question.card),
  }, index }))
    .filter(({ question }) => !selectedTags.length || selectedTags.some(tag => question.tags?.includes(tag)));
  const unseen = matching.filter(({ question }) => !question.card.reps);
  // Reserve the last fifth of the original calendar window for consolidation.
  const start = new Date(`${startedOn}T00:00:00`);
  const totalDays = Math.max(1, Math.round((new Date(`${deadline}T00:00:00`) - start) / DAY) + 1);
  const introductionEnd = new Date(start);
  introductionEnd.setDate(start.getDate() + Math.max(0, Math.ceil(totalDays * 0.8) - 1));
  const todayStart = new Date(`${localDate(now)}T00:00:00`);
  const introductionDays = Math.max(1, Math.round((introductionEnd - todayStart) / DAY) + 1);
  const newGoal = Math.ceil((unseen.length + today.newCount) / introductionDays);
  const newRemaining = Math.max(0, newGoal - today.newCount);
  const budget = Math.max(0, dailyLimit - today.answers);
  const dayKey = localDate(now);
  const reviewed = matching.filter(({ question }) => question.card.reps > 0);
  const due = reviewed.filter(({ question, index }) => !blockedIndexes.includes(index) && new Date(question.card.due) <= now);
  const learning = due.filter(({ question }) => [State.Learning, State.Relearning].includes(question.card.state));
  const reviewItems = reviewed.filter(({ question, index }) => !blockedIndexes.includes(index) && question.card.state === State.Review &&
    localDate(new Date(question.card.last_review || now)) !== localDate(now));
  const futureLearning = reviewed.filter(({ question }) =>
    [State.Learning, State.Relearning].includes(question.card.state));
  const newSlots = Math.min(unseen.length, newRemaining, budget);
  const futureNewQuota = Math.min(dailyLimit, Math.ceil(Math.max(0, unseen.length - newSlots) /
    Math.max(1, introductionDays - 1)));
  const allocation = allocateReviewPlans(reviewItems, {
    now, end, targetRetention,
    capacityForDay: date => {
      const key = localDate(date);
      const reservedLearning = futureLearning.filter(({ question }) => {
        const dueDate = new Date(question.card.due);
        return key === dayKey ? dueDate <= now : localDate(dueDate) === key;
      }).length;
      const reservedNew = key === dayKey ? newSlots : key <= localDate(introductionEnd) ? futureNewQuota : 0;
      return Math.max(0, (key === dayKey ? budget : dailyLimit) - reservedNew - reservedLearning);
    },
  });
  const reviews = allocation.today.map(plan => ({ index: plan.index }));
  // Malformed imported review cards can still be studied at their stored due date.
  const fallback = due.filter(({ question, index }) => question.card.state === State.Review &&
    !allocation.scheduled.has(index) && (!(question.card.stability > 0) || !question.card.last_review));
  reviews.push(...fallback);
  // Reserve slots for today's introductions so a review backlog cannot starve them.
  let candidates = [];
  if (budget > 0) {
    if (newSlots > 0 && budget <= newSlots) candidates = unseen;
    else if (learning.length) candidates = learning;
    else if (reviews.length) candidates = [reviews[0]];
    else if (newSlots > 0) candidates = unseen;
  }
  const estimated = reviewed.map(({ question }) => recallAt(question.card, end));
  return {
    candidates: candidates.map(item => item.index),
    count: Math.min(budget, learning.length + reviews.length + newSlots),
    total: matching.length, unseen: unseen.length, newGoal, newRemaining,
    ready: estimated.filter(value => value >= targetRetention).length,
    predictedRetention: matching.length ? estimated.reduce((sum, value) => sum + value, 0) / matching.length : 0,
    overloaded: newGoal > dailyLimit,
    plannedReviews: allocation.scheduled.size,
    unplannedReviews: allocation.unplanned,
    nextReviewDate: [...allocation.scheduled.values()].map(plan => localDate(plan.dates[0]))
      .filter(date => date > dayKey).sort()[0] || null,
  };
}

const KEY = 'learning-app-deadline-plan';
export function loadDeadlineSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    return stored && typeof stored === 'object' ? stored : {};
  } catch { return {}; }
}

export function saveDeadlineSettings(settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* Learning remains available without storage. */ }
}
