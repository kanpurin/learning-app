import { State } from 'ts-fsrs';
import { getQuestionQueue } from './questionRecommendation';
import { normalizeFsrsCard } from './fsrsCard';
import { recallAt } from './deadlinePlan';

export function getRecommendationDiagnostics(questions, options, {
  plan, timeBlockedIndexes = [], checkpoint = false,
} = {}) {
  const { now, memoryMode, selectedTags = [], blockedIndexes = [] } = options;
  const strict = memoryMode === 'deadline' ? plan : getQuestionQueue(questions, options);
  const relaxed = memoryMode === 'deadline' ? plan : getQuestionQueue(questions, {
    ...options, blockedIndexes: timeBlockedIndexes,
  });
  const queue = strict?.candidates.length ? strict : relaxed;
  const candidates = checkpoint ? [] : queue?.candidates || [];
  const effectiveBlocked = memoryMode === 'deadline' ? plan?.blockedIndexes || []
    : strict?.candidates.length ? blockedIndexes : timeBlockedIndexes;
  return questions.map((question, index) => {
    const card = normalizeFsrsCard(question.card);
    const assessment = plan?.assessed.find(item => item.index === index);
    const matching = !selectedTags.length || selectedTags.some(tag => question.tags?.includes(tag));
    let reason;
    if (!matching) reason = 'タグ対象外';
    else if (memoryMode === 'deadline' && !plan) reason = '目標日未設定';
    else if (plan?.status === 'expired') reason = '期限切れ';
    else if (assessment?.ready) reason = '目標記憶率に到達（推定）';
    else if (checkpoint) reason = '今日の目標達成で停止中';
    else if (candidates.includes(index)) reason = '次の出題候補';
    else if (effectiveBlocked.includes(index)) reason = '再出題の間隔・他問題の回答待ち';
    else if (assessment && assessment.availableAt > now.getTime()) reason = '復習可能時刻待ち';
    else if (memoryMode !== 'deadline' && memoryMode !== 'infinite' && card.reps > 0 && card.due > now) reason = 'FSRS復習予定前';
    else if (!card.reps && options.newQuestionsRemaining <= 0 && memoryMode !== 'deadline' && memoryMode !== 'infinite') reason = '今回の新規上限に到達';
    else {
      const group = value => !value.reps ? 'new'
        : [State.Learning, State.Relearning].includes(value.state) ? 'learning' : 'review';
      const sameGroup = candidates.some(candidate => group(questions[candidate].card) === group(card));
      reason = sameGroup ? '今回の出題回数が少ない問題を先に出題' : '他の出題枠を先に出題';
    }
    return {
      index, problem: question.problem, tags: question.tags || [], reason,
      probability: candidates.includes(index) ? 1 / candidates.length : 0,
      reps: card.reps, lapses: card.lapses, due: card.due,
      availableAt: assessment ? new Date(assessment.availableAt) : card.due,
      retention: card.reps ? recallAt(card, now) : null,
      targetRetention: assessment?.retention,
      state: ['未学習', '学習中', '復習', '再学習'][card.state] || String(card.state),
      overdue: card.reps > 0 && card.due <= now && card.state === State.Review,
    };
  });
}
