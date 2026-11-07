import { State } from 'ts-fsrs';
import { predictRecall } from './deadlineReviewPlanning';
import { normalizeFsrsCard } from './fsrsCard';
import { deadlineReviewAt } from './deadlineSchedule';
import { interleavedCandidates } from './interleavedQueue';

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
  now = new Date(), today = { answers: 0, newCount: 0 },
  blockedIndexes = [],
  newQuestionGoal = Infinity,
  presented = {},
}) {
  const end = deadlineDate(deadline);
  if (!Number.isFinite(end.getTime())) return null;
  const matching = questions.map((question, index) => ({ question: {
    ...question, card: normalizeFsrsCard(question.card),
  }, index }))
    .filter(({ question }) => !selectedTags.length || selectedTags.some(tag => question.tags?.includes(tag)));
  const unseen = matching.filter(({ question }) => !question.card.reps);
  const assessed = matching.map(item => {
    const card = item.question.card;
    const retention = recallAt(card, end);
    const ready = card.reps > 0 && card.state === State.Review && retention >= targetRetention;
    const learning = [State.Learning, State.Relearning].includes(card.state);
    const availableAt = !card.reps ? now.getTime() : +deadlineReviewAt(card, end);
    return { ...item, retention, ready, learning, availableAt };
  });
  const pending = assessed.filter(item => !item.ready);
  const eligible = pending.filter(item => item.availableAt <= now.getTime() && !blockedIndexes.includes(item.index));
  const learning = eligible.filter(item => item.learning);
  const newItems = eligible.filter(item => !item.question.card.reps);
  const reviews = eligible.filter(item => item.question.card.reps > 0 && !item.learning);
  const expired = end < now;
  const reviewFirst = today.newCount >= newQuestionGoal || end - now <= DAY;
  const groups = reviewFirst ? [learning, reviews, newItems] : [learning, newItems, reviews];
  const candidates = expired ? [] : interleavedCandidates(groups, today.answers, presented);
  const nextAt = pending.filter(item => item.availableAt > now.getTime())
    .reduce((earliest, item) => Math.min(earliest, item.availableAt), Infinity);
  const remainingDays = Math.max(1, Math.ceil((end - now) / DAY));
  const minimumDailyAnswers = Math.ceil(pending.length / remainingDays);
  return {
    assessed,
    blockedIndexes,
    candidates: candidates.map(item => item.index),
    count: pending.length, total: matching.length, unseen: unseen.length,
    newGoal: unseen.length + today.newCount, newRemaining: unseen.length,
    ready: matching.length - pending.length,
    predictedRetention: matching.length ? assessed.reduce((sum, item) => sum + item.retention, 0) / matching.length : 0,
    minimumAdditionalAnswers: pending.length, minimumDailyAnswers,
    overloaded: minimumDailyAnswers > dailyLimit,
    exceededDailyGoal: today.answers >= dailyLimit && pending.length > 0,
    nextReviewAt: Number.isFinite(nextAt) ? new Date(nextAt) : null,
    cannotRetryBeforeDeadline: pending.some(item => item.availableAt > end.getTime()),
    status: !matching.length ? 'empty' : expired ? 'expired' : !pending.length ? 'target_met' : candidates.length ? 'studying' : 'waiting',
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
