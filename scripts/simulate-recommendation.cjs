const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const original = require.extensions['.js'];
const source = path.resolve(__dirname, '../src/lib') + path.sep;
require.extensions['.js'] = (module, filename) => {
  if (!filename.startsWith(source)) return original(module, filename);
  module._compile(babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    babelrc: false, configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code, filename);
};
const { simulateStudy } = require('../src/lib/recommendationSimulation');
const { getDeadlinePlan } = require('../src/lib/deadlinePlan');
const { answerSpacing } = require('../src/lib/retrySpacing');
const { recallAt, deadlineDate } = require('../src/lib/deadlinePlan');
const { getQuestionQueue } = require('../src/lib/questionRecommendation');
const { State, Rating, createEmptyCard } = require('ts-fsrs');

function priorityQueue(questions, options) {
  const queue = getQuestionQueue(questions, { ...options, memoryMode: 'long' });
  return queue;
}

// Previous spacing-only implementation: retain dates but restore strict group priority.
function priorityPlan(questions, options) {
  const plan = getDeadlinePlan(questions, options);
  const { now, today = { answers: 0, newCount: 0 }, blockedIndexes = [], newQuestionGoal = Infinity } = options;
  const eligible = plan.assessed.filter(item => !item.ready && item.availableAt <= +now && !blockedIndexes.includes(item.index));
  const learning = eligible.filter(item => item.learning);
  const fresh = eligible.filter(item => !item.question.card.reps);
  const reviews = eligible.filter(item => item.question.card.reps && !item.learning)
    .sort((a, b) => a.retention - b.retention || a.index - b.index);
  const candidates = learning.length && fresh.length && today.answers % 2 === 1 ? fresh
    : learning.length ? learning : reviews.length && today.newCount >= newQuestionGoal ? reviews.slice(0, 1)
      : fresh.length ? fresh : reviews.slice(0, 1);
  return { ...plan, candidates: candidates.map(item => item.index),
    status: !plan.count ? 'target_met' : candidates.length ? 'studying' : 'waiting' };
}

if (process.argv.includes('--mix')) {
  const start = new Date('2026-11-07T00:00:00');
  const initialCards = Array.from({ length: 90 }, (_, index) => index >= 75 ? createEmptyCard(start) : {
    ...createEmptyCard(start), reps: 3, state: index < 60 ? State.Relearning : State.Review,
    stability: index < 60 ? 0.4 : 2, difficulty: 8,
    last_review: new Date(+start - 86400000), due: start,
  });
  const results = [];
  for (const memoryMode of ['short', 'deadline']) {
    for (const version of ['priority', 'interleaved']) {
      const result = simulateStudy({ count: 90, start, memoryMode, initialCards,
        ratingFor: (index, attempt) => index < 60 && attempt <= 2 ? Rating.Again : Rating.Good,
        ...(version === 'priority' ? { queueForMode: priorityQueue, planFor: priorityPlan } : {}) });
      const { events, ...summary } = result;
      results.push({ version, ...summary,
        first30: events.slice(0, 30).reduce((counts, event) => ({ ...counts, [event.group]: (counts[event.group] || 0) + 1 }), {}),
        first30Indexes: events.slice(0, 30).map(event => event.index),
      });
    }
  }
  console.log(JSON.stringify({ assumptions: '90 cards: 60 relearning (first two answers fail), 15 due reviews, 15 new. Same timing/spacing and fixed seed; only group selection changes.', results }));
  process.exit(0);
}

// Frozen pre-change selection policy for the before/after simulation only.
function legacyPlan(questions, options) {
  const plan = getDeadlinePlan(questions, options);
  const { now, today = { answers: 0, newCount: 0 }, blockedIndexes = [], newQuestionGoal = Infinity } = options;
  const assessed = plan.assessed.map(item => {
    const card = item.question.card;
    const spaced = card.last_review ? +card.last_review + 600000 : +now;
    return { ...item, availableAt: !card.reps ? +now : item.learning ? Math.max(spaced, +card.due) : spaced };
  });
  const eligible = assessed.filter(item => !item.ready && item.availableAt <= +now && !blockedIndexes.includes(item.index));
  const learning = eligible.filter(item => item.learning);
  const unseen = eligible.filter(item => !item.question.card.reps);
  const reviews = eligible.filter(item => item.question.card.reps && !item.learning)
    .sort((a, b) => a.retention - b.retention || a.index - b.index);
  const candidates = learning.length && unseen.length && today.answers % 2 === 1 ? unseen
    : learning.length ? learning : reviews.length && today.newCount >= newQuestionGoal ? reviews.slice(0, 1)
      : unseen.length ? unseen : reviews.slice(0, 1);
  return { ...plan, assessed, candidates: candidates.map(item => item.index),
    status: !plan.count ? 'target_met' : candidates.length ? 'studying' : 'waiting' };
}
const oldSpacing = (mode, correct, answers, now) => correct ? null : answerSpacing(mode, correct, answers, now);
const results = [];
for (const count of [1, 40]) {
  for (const firstAttemptFails of [false, true]) {
    for (const memoryMode of ['short', 'deadline']) {
      for (const version of ['before', 'after']) {
        const result = simulateStudy({ count, firstAttemptFails, memoryMode,
          ...(version === 'before' ? { planFor: legacyPlan, spacingFor: oldSpacing, queueForMode: priorityQueue } : {}) });
        results.push({ version, firstAttemptFails, ...result });
      }
    }
  }
}
const assumptions = { start: '2026-11-07T00:00:00', deadline: '2026-12-06',
  dailyLimit: 30, targetRetention: 0.9, answerDurationUsed: false,
  newQuestionLimit: 'Deck size in short mode; reset session daily.',
  schedule: 'Daily session; answer immediately when eligible; stop at daily goal; fixed random seed. Before/after share the updated workload estimator to isolate selection-policy changes.' };
if (process.argv.includes('--chart')) {
  const before = results.find(row => row.count === 1 && row.memoryMode === 'deadline' && !row.firstAttemptFails && row.version === 'before');
  const after = results.find(row => row.count === 1 && row.memoryMode === 'deadline' && !row.firstAttemptFails && row.version === 'after');
  const end = deadlineDate(assumptions.deadline);
  const rows = Array.from({ length: Math.max(before.answers, after.answers) }, (_, i) => [i + 1,
    before.events[i] ? recallAt(before.events[i].card, end) : null,
    after.events[i] ? recallAt(after.events[i].card, end) : null]);
  console.log(JSON.stringify({ assumptions,
    summary: results.map(({ events, ...row }) => row),
    config: { id: 'deadline-answer-efficiency', title: '期限付き：回答回数と目標日の予測記憶率',
      description: '架空の1問・30日間・目標90%・すべて普通で正答。横軸は同じ問題への累積回答数。各回答直後から、以後復習しない場合の期限時点の予測。到達後は回答しない。',
      height: 340, columns: ['累積回答数', '変更前', '変更後'], rows,
      spec: { type: 'line', x: '累積回答数', y: ['変更前', '変更後'],
        xLabel: '同じ1問への累積回答数（回）', yLabel: '目標日の予測記憶率',
        yDomain: [0, 1], showLegend: true, valueFormat: { style: 'percent', maximumFractionDigits: 1 } } },
  }));
} else {
  console.log(JSON.stringify({ assumptions,
    results: process.argv.includes('--json') ? results : results.map(({ events, ...row }) => row) }));
}
