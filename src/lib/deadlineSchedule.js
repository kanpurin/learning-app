import { State } from 'ts-fsrs';
import { normalizeFsrsCard } from './fsrsCard';
import { RETRY_WAIT_MS } from './retrySpacing';

const DAY = 86400000;

// Leave one day for recovery when possible, without repeating normal reviews on the same day.
export function deadlineReviewAt(value, end) {
  const card = normalizeFsrsCard(value);
  if (!card.reps) return null;
  const last = card.last_review?.getTime();
  const earliest = Number.isFinite(last) ? last + RETRY_WAIT_MS : -Infinity;
  if ([State.Learning, State.Relearning].includes(card.state)) {
    return new Date(Math.max(earliest, +card.due));
  }
  const spaced = Number.isFinite(last) ? last + DAY : -Infinity;
  const latest = Math.max(spaced, +end - DAY);
  const planned = Math.min(Math.max(+card.due, spaced), latest, +end - RETRY_WAIT_MS);
  return new Date(Math.max(earliest, planned));
}
