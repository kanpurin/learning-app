import { fsrs, Rating } from 'ts-fsrs';
import { normalizeFsrsCard } from './fsrsCard';

const model = fsrs({ enable_short_term: true, maximum_interval: 90 });
const EPSILON = 1e-8;

export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function predictRecall(card, date) {
  if (!card.reps || !card.last_review || !(card.stability > 0)) return 0;
  const value = model.get_retrievability(normalizeFsrsCard(card), date, false);
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function candidateDates(card, now, end) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const lastDay = new Date(end);
  lastDay.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  const middle = new Date(now.getTime() + (lastDay - now) / 2);
  const due = new Date(card.due);
  due.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  const firstDay = new Date(now);
  firstDay.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.round((endDay - firstDay) / 86400000));
  const sampled = Array.from({ length: Math.min(days, 31) + 1 }, (_, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() + Math.round(i * days / Math.max(1, Math.min(days, 31))));
    return date;
  });
  return [...new Map([now, tomorrow, due, middle, lastDay, ...sampled]
    .filter(date => date >= now && date <= end)
    .map(date => [dateKey(date), date])).values()].sort((a, b) => a - b);
}

function outcomes(card, when) {
  const probability = predictRecall(card, when);
  const branches = model.repeat(card, when);
  return [
    { card: branches[Rating.Good].card, probability },
    { card: branches[Rating.Again].card, probability: 1 - probability },
  ];
}

function terminalValue(branches, end, target) {
  return Math.min(target, branches.reduce((sum, branch) => sum + branch.probability *
    Math.min(target, predictRecall(branch.card, end)), 0));
}

// Bounded two-review lookahead; ratings and future learning steps remain approximations.
export function reviewAlternatives(card, { now, end, targetRetention = 0.9 }) {
  card = normalizeFsrsCard(card);
  const baseline = Math.min(targetRetention, predictRecall(card, end));
  if (baseline >= targetRetention - EPSILON) return [];
  const dates = candidateDates(card, now, end);
  const alternatives = [];
  for (const first of dates) {
    try {
      const branches = outcomes(card, first);
      const value = terminalValue(branches, end, targetRetention);
      if (value > baseline + EPSILON) alternatives.push({ dates: [first], gain: value - baseline, value });
      const later = dates.filter(date => dateKey(date) > dateKey(first));
      const secondDates = [...new Set([later[0], later[Math.floor(later.length / 2)], later[later.length - 1]])].filter(Boolean);
      for (const second of secondDates) {
        // A failure must not be reviewed before FSRS's next learning step.
        if (branches[1].probability > 0 && new Date(branches[1].card.due) > second) continue;
        const next = branches.flatMap(branch => outcomes(branch.card, second)
          .map(result => ({ ...result, probability: branch.probability * result.probability })));
        const nextValue = terminalValue(next, end, targetRetention);
        if (nextValue > baseline + EPSILON) alternatives.push({ dates: [first, second], gain: nextValue - baseline, value: nextValue });
      }
    } catch {
      // Incomplete imported cards fall back to their actual due date in the caller.
    }
  }
  return alternatives;
}

export function allocateReviewPlans(items, { now, end, targetRetention, capacityForDay }) {
  const used = new Map();
  const scheduled = new Map();
  const alternatives = items.flatMap(({ question, index }) =>
    reviewAlternatives(question.card, { now, end, targetRetention }).map(plan => ({ ...plan, index })));
  alternatives.sort((a, b) => b.gain / b.dates.length - a.gain / a.dates.length ||
    a.dates.length - b.dates.length || b.dates[0] - a.dates[0] || a.index - b.index);
  for (const plan of alternatives) {
    if (scheduled.has(plan.index)) continue;
    if (!plan.dates.every(date => (used.get(dateKey(date)) || 0) < capacityForDay(date))) continue;
    scheduled.set(plan.index, plan);
    plan.dates.forEach(date => used.set(dateKey(date), (used.get(dateKey(date)) || 0) + 1));
  }
  const today = [...scheduled.values()].filter(plan => dateKey(plan.dates[0]) === dateKey(now));
  return { scheduled, today, unplanned: items.filter(item =>
    predictRecall(item.question.card, end) < targetRetention && !scheduled.has(item.index)).length };
}
