import { cardDate } from './fsrsCard';

export const RETRY_WAIT_MS = 10 * 60 * 1000;
export const RETRY_OTHER_ANSWERS = 5;

export function delayRetry(card, now) {
  return { ...card, due: new Date(Math.max(cardDate(card.due).getTime(), now.getTime() + RETRY_WAIT_MS)) };
}

export function blockedRetries(retries, answers, now, allowWithoutOtherAnswers = false) {
  return Object.entries(retries).filter(([, retry]) =>
    now.getTime() < retry.notBefore || (!allowWithoutOtherAnswers && answers < retry.afterAnswers))
    .map(([index]) => Number(index));
}
