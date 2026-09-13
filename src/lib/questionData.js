import { createEmptyCard } from 'ts-fsrs';
import { QUESTION_TYPES } from '../constants/questionTypes';

const VALID_QUESTION_TYPES = Object.values(QUESTION_TYPES);

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

const validateStringField = (question, field, label, errors) => {
  if (question[field] !== undefined && typeof question[field] !== 'string') {
    errors.push(`${label}: ${field} は文字列で指定してください。`);
  }
};

const validateTags = (question, label, errors) => {
  if (question.tags === undefined) return;
  if (!Array.isArray(question.tags) || question.tags.some((tag) => typeof tag !== 'string')) {
    errors.push(`${label}: tags は文字列の配列で指定してください。`);
  }
};

const validateRandom = (question, label, errors) => {
  if (question.random !== undefined && typeof question.random !== 'boolean') {
    errors.push(`${label}: random は true または false で指定してください。`);
  }
};

const validateCard = (question, label, errors) => {
  if (question.card !== undefined && !isPlainObject(question.card)) {
    errors.push(`${label}: card はオブジェクトで指定してください。`);
  }
};

const validateOptions = (question, label, errors) => {
  if (!Array.isArray(question.options)) {
    errors.push(`${label}: options は選択肢の配列で指定してください。`);
    return [];
  }

  const filledOptions = question.options.filter((option) => typeof option === 'string' && option.trim() !== '');
  if (question.options.some((option) => typeof option !== 'string')) {
    errors.push(`${label}: options の各項目は文字列で指定してください。`);
  }
  if (filledOptions.length < 2) {
    errors.push(`${label}: options は空でない選択肢を2件以上指定してください。`);
  }
  return filledOptions;
};

const validateAnswerIndexes = (answer, options, label, errors, { exactLength = false } = {}) => {
  if (!Array.isArray(answer) || answer.length === 0) {
    errors.push(`${label}: answer は正解の選択肢番号を入れた配列で指定してください。`);
    return;
  }

  if (!answer.every(isPositiveInteger)) {
    errors.push(`${label}: answer の選択肢番号は1以上の整数で指定してください。`);
  }

  const uniqueAnswers = new Set(answer);
  if (uniqueAnswers.size !== answer.length) {
    errors.push(`${label}: answer に重複した選択肢番号があります。`);
  }

  const optionCount = options.length;
  if (answer.some((index) => index > optionCount)) {
    errors.push(`${label}: answer に options の範囲外の選択肢番号があります。`);
  }

  if (exactLength && answer.length !== optionCount) {
    errors.push(`${label}: 並べ替え問題の answer は全選択肢を正しい順番で1回ずつ指定してください。`);
  }
};

export const validateQuestion = (question, index = 0) => {
  const errors = [];
  const label = `${index + 1}問目`;

  if (!isPlainObject(question)) {
    return [`${label}: 問題データはオブジェクトで指定してください。`];
  }

  validateStringField(question, 'summary', label, errors);
  validateStringField(question, 'problem', label, errors);
  validateStringField(question, 'explanation', label, errors);
  validateTags(question, label, errors);
  validateRandom(question, label, errors);
  validateCard(question, label, errors);

  const type = question.type || QUESTION_TYPES.MULTIPLE_CHOICE;
  if (!VALID_QUESTION_TYPES.includes(type)) {
    errors.push(`${label}: type は ${VALID_QUESTION_TYPES.join(', ')} のいずれかで指定してください。`);
    return errors;
  }

  if (type === QUESTION_TYPES.WORD) {
    if (typeof question.answer !== 'string' || question.answer.trim() === '') {
      errors.push(`${label}: 単語入力問題の answer は空でない文字列で指定してください。`);
    }
    if (
      question.options !== undefined &&
      question.options !== null &&
      (!Array.isArray(question.options) || question.options.some((option) => typeof option !== 'string'))
    ) {
      errors.push(`${label}: 単語入力問題の options は null または文字列の配列で指定してください。`);
    }
    return errors;
  }

  const options = validateOptions(question, label, errors);
  validateAnswerIndexes(
    question.answer,
    options,
    label,
    errors,
    { exactLength: type === QUESTION_TYPES.ORDERING },
  );

  if (type === QUESTION_TYPES.MULTIPLE_CHOICE && Array.isArray(question.answer) && question.answer.length !== 1) {
    errors.push(`${label}: 単一選択問題の answer は正解番号を1つだけ指定してください。`);
  }

  return errors;
};

export const validateQuestions = (data) => {
  if (!Array.isArray(data)) {
    return ['JSON全体は問題オブジェクトの配列で指定してください。'];
  }

  return data.flatMap((question, index) => validateQuestion(question, index));
};

export const formatValidationErrors = (errors) => {
  const visibleErrors = errors.slice(0, 10);
  const hiddenCount = errors.length - visibleErrors.length;
  return [
    '問題データの形式に誤りがあります。',
    '',
    ...visibleErrors,
    ...(hiddenCount > 0 ? [`ほか ${hiddenCount} 件のエラーがあります。`] : []),
  ].join('\n');
};

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
