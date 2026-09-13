import { normalizeQuestion, serializeQuestions, validateQuestions } from './questionData';

describe('questionData', () => {
  test('accepts supported question formats', () => {
    const errors = validateQuestions([
      {
        type: 'mcq',
        problem: 'Which one?',
        options: ['A', 'B'],
        answer: [1],
      },
      {
        type: 'mrq',
        problem: 'Choose all',
        options: ['A', 'B', 'C'],
        answer: [1, 3],
      },
      {
        type: 'order',
        problem: 'Order these',
        options: ['First', 'Second'],
        answer: [1, 2],
      },
      {
        type: 'word',
        problem: 'React state hook',
        options: null,
        answer: 'useState',
      },
    ]);

    expect(errors).toEqual([]);
  });

  test('reports invalid question data with question numbers', () => {
    const errors = validateQuestions([
      {
        type: 'mcq',
        options: ['A', 'B'],
        answer: [3],
      },
      {
        type: 'word',
        answer: ['useState'],
      },
    ]);

    expect(errors).toEqual([
      '1問目: answer に options の範囲外の選択肢番号があります。',
      '2問目: 単語入力問題の answer は空でない文字列で指定してください。',
    ]);
  });

  test('normalizes missing optional fields', () => {
    const question = normalizeQuestion({ problem: 'Question' });

    expect(question).toMatchObject({
      problem: 'Question',
      options: [],
      answer: '',
      explanation: '',
      type: 'mcq',
      summary: '',
      deleted: false,
      tags: [],
      random: false,
    });
    expect(question.card).toMatchObject({ reps: 0, lapses: 0 });
  });

  test('omits deleted questions when serializing', () => {
    const serialized = serializeQuestions([
      {
        problem: 'Keep',
        options: ['A', 'B'],
        answer: [1],
        type: 'mcq',
        deleted: false,
      },
      {
        problem: 'Remove',
        options: ['A', 'B'],
        answer: [1],
        type: 'mcq',
        deleted: true,
      },
    ]);

    expect(serialized).toHaveLength(1);
    expect(serialized[0].problem).toBe('Keep');
  });
});

