export function cardDate(value) {
  if (value && typeof value.toDate === 'function') return value.toDate();
  if (value && typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1000000);
  }
  return value instanceof Date ? value : new Date(value);
}

export function normalizeFsrsCard(card) {
  return {
    ...card,
    due: cardDate(card.due),
    ...(card.last_review != null ? { last_review: cardDate(card.last_review) } : {}),
  };
}

export function serializeFsrsCard(card) {
  const normalized = normalizeFsrsCard(card);
  return {
    ...normalized,
    due: normalized.due.toISOString(),
    ...(normalized.last_review != null ? { last_review: normalized.last_review.toISOString() } : {}),
  };
}
