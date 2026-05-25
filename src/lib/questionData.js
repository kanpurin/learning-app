import { createEmptyCard } from 'ts-fsrs';

export const normalizeQuestion = (item = {}) => ({
  problem: item.problem || '',
  options: item.options || [],
  answer: item.answer || '',
  explanation: item.explanation || '',
  type: item.type || 'mcq',
  summary: item.summary || '',
  deleted: false,
  tags: item.tags || [],
  card: item.card || createEmptyCard(),
  random: item.random || false,
});

export const normalizeQuestions = (data = []) => data.map(normalizeQuestion);

export const serializeQuestion = (question) => ({
  problem: question.problem,
  options: question.options,
  answer: question.answer,
  explanation: question.explanation || '',
  type: question.type,
  summary: question.summary || '',
  tags: question.tags || [],
  card: question.card || createEmptyCard(),
  random: question.random || false,
});

export const serializeQuestions = (questions = []) =>
  questions.filter((question) => !question.deleted).map(serializeQuestion);

export const createQuestionDraft = (overrides = {}) => ({
  summary: '',
  problem: '',
  options: ['', ''],
  answer: [],
  explanation: '',
  tags: [],
  ...overrides,
});

export const createQuestionRecord = (question, type, overrides = {}) => ({
  ...question,
  type,
  deleted: false,
  card: createEmptyCard(),
  ...overrides,
});

