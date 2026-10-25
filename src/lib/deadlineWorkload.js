import { fsrs, Rating, State } from 'ts-fsrs';
import { normalizeFsrsCard } from './fsrsCard';
import { predictRecall } from './deadlineReviewPlanning';
import { RETRY_WAIT_MS, delayRetry } from './retrySpacing';

const model = fsrs({ enable_short_term: true, maximum_interval: 90 });
const MAX_REVIEWS_PER_CARD = 100;

function reached(card, end, target) {
  return card.reps > 0 && card.state === State.Review && predictRecall(card, end) >= target;
}

function simulate(questions, { now, end, targetRetention }, firstAttemptFails) {
  let answers = 0;
  let unresolved = 0;
  let invalid = 0;
  for (const question of questions) {
    try {
      let card = normalizeFsrsCard(question.card);
      let when = new Date(now);
      let attempts = 0;
      while (!reached(card, end, targetRetention) && attempts < MAX_REVIEWS_PER_CARD) {
        if (card.reps > 0) {
          const last = card.last_review?.getTime();
          const earliest = Number.isFinite(last) ? last + RETRY_WAIT_MS : +when;
          const learning = [State.Learning, State.Relearning].includes(card.state);
          const nextDay = Number.isFinite(last) ? new Date(last) : new Date(when);
          nextDay.setDate(nextDay.getDate() + 1);
          // Spaced normal reviews avoid an endless run of same-day memory updates.
          const scheduled = learning ? +card.due : Math.min(+card.due, +nextDay);
          when = new Date(Math.max(+when, earliest, scheduled));
        }
        if (when > end) break;
        const rating = firstAttemptFails && attempts === 0 ? Rating.Again : Rating.Good;
        const result = model.next(card, when, rating).card;
        card = rating === Rating.Again ? delayRetry(result, when) : result;
        attempts += 1;
      }
      answers += attempts;
      if (!reached(card, end, targetRetention)) unresolved += 1;
    } catch {
      invalid += 1;
    }
  }
  const complete = unresolved === 0 && invalid === 0;
  const days = Math.max(1, Math.ceil((end - now) / 86400000));
  return {
    remainingAnswers: complete ? answers : null,
    answersPerDay: complete ? Math.ceil(answers / days) : null,
    unresolved, invalid,
  };
}

export function estimateDeadlineWorkload(questions, {
  now = new Date(), end, targetRetention = 0.9, selectedTags = [],
}) {
  if (!(end instanceof Date) || !Number.isFinite(+end) || end < now) return null;
  const matching = questions.filter(question => !selectedTags.length ||
    selectedTags.some(tag => question.tags?.includes(tag)));
  const options = { now, end, targetRetention };
  return {
    good: simulate(matching, options, false),
    oneFailure: simulate(matching, options, true),
  };
}
