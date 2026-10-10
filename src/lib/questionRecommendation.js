import { State } from 'ts-fsrs';

export const DEFAULT_NEW_QUESTION_LIMIT = 10;

export function getQuestionQueue(questions, {
  selectedTags = [], memoryMode, newQuestionsRemaining = DEFAULT_NEW_QUESTION_LIMIT,
  now = new Date(),
} = {}) {
  const matching = questions.map((question, index) => ({ question, index }))
    .filter(({ question }) => selectedTags.length === 0 ||
      selectedTags.some(tag => question.tags?.includes(tag)));
  if (memoryMode === 'infinite') return { candidates: matching.map(item => item.index), count: matching.length };

  const due = matching.filter(({ question }) => question.card.reps > 0 &&
    new Date(question.card.due) <= now);
  const learning = due.filter(({ question }) =>
    question.card.state === State.Learning || question.card.state === State.Relearning);
  const unseen = matching.filter(({ question }) => question.card.reps === 0);
  const newCount = Math.min(unseen.length, Math.max(0, newQuestionsRemaining));
  const candidates = learning.length ? learning : due.length ? due : newCount > 0 ? unseen : [];
  return { candidates: candidates.map(item => item.index), count: due.length + newCount };
}

export function selectQuestionIndex(questions, options, random = Math.random) {
  const { candidates } = getQuestionQueue(questions, options);
  return candidates.length ? candidates[Math.floor(random() * candidates.length)] : null;
}
