import { fsrs, Rating, State } from 'ts-fsrs';

const model = fsrs({ enable_short_term: true, maximum_interval: 90 });
const DAY = 86400000;

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function deadlineDate(value) {
  return new Date(`${value}T23:59:59`);
}

export function recallAt(card, date) {
  if (!card.reps || !card.last_review || !(card.stability > 0)) return 0;
  return model.get_retrievability(card, date, false);
}

export function getDeadlinePlan(questions, {
  deadline, targetRetention = 0.9, dailyLimit = 30, selectedTags = [],
  startedOn = localDate(), now = new Date(), today = { answers: 0, newCount: 0 },
}) {
  const end = deadlineDate(deadline);
  if (!Number.isFinite(end.getTime()) || end < now) return null;
  const matching = questions.map((question, index) => ({ question, index }))
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
  const reviewed = matching.filter(({ question }) => question.card.reps > 0);
  const due = reviewed.filter(({ question }) => new Date(question.card.due) <= now);
  const learning = due.filter(({ question }) => [State.Learning, State.Relearning].includes(question.card.state));
  const risks = reviewed.filter(({ question }) => question.card.state === State.Review &&
    localDate(new Date(question.card.last_review || now)) !== localDate(now) &&
    recallAt(question.card, end) < targetRetention);
  const priority = item => {
    const card = item.question.card;
    const before = recallAt(card, end);
    let after = before;
    try {
      const branches = model.repeat(card, now);
      const success = recallAt(card, now);
      after = success * recallAt(branches[Rating.Good].card, end) +
        (1 - success) * recallAt(branches[Rating.Again].card, end);
    } catch {
      // Imported cards with incomplete model data still receive deficit priority.
    }
    const deficit = Math.max(0, targetRetention - before);
    return Math.max(0, after - before) * deficit;
  };
  const reviews = [...new Map([...due, ...risks].map(item => [item.index, item])).values()]
    .sort((a, b) => priority(b) - priority(a) || new Date(a.question.card.due) - new Date(b.question.card.due));
  // Reserve slots for today's introductions so a review backlog cannot starve them.
  const newSlots = Math.min(unseen.length, newRemaining, budget);
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
    count: Math.min(budget, reviews.length + newSlots),
    total: matching.length, unseen: unseen.length, newGoal, newRemaining,
    ready: estimated.filter(value => value >= targetRetention).length,
    predictedRetention: matching.length ? estimated.reduce((sum, value) => sum + value, 0) / matching.length : 0,
    overloaded: newGoal > dailyLimit,
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
