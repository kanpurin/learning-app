import React, { useState, useEffect, useMemo, useRef } from 'react';
import MultipleChoiceQuestion from './MultipleChoiceQuestion/MultipleChoiceQuestion';
import MultipleResponseQuestion from './MultipleResponseQuestion/MultipleResponseQuestion';
import OrderingQuestion from './OrderingQuestion/OrderingQuestion';
import WordQuestion from './WordQuestion/WordQuestion';
import { fsrs, generatorParameters, Rating, State } from 'ts-fsrs';
import TagSelector from './TagSelector';
import { QUESTION_TYPES } from '../constants/questionTypes';
import { DEFAULT_NEW_QUESTION_LIMIT, getQuestionQueue, selectQuestionIndex } from '../lib/questionRecommendation';
import { deadlineDate, getDeadlinePlan, loadDeadlineSettings, localDate, saveDeadlineSettings } from '../lib/deadlinePlan';
import { estimateDeadlineWorkload } from '../lib/deadlineWorkload';
import { createDailyGoal, DAILY_GOAL_VERSION } from '../lib/dailyGoal';
import { normalizeFsrsCard } from '../lib/fsrsCard';
import { blockedRetries, delayRetry, RETRY_WAIT_MS, RETRY_OTHER_ANSWERS } from '../lib/retrySpacing';

const Question = ({ questions, setQuestions }) => {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [isCorrect, setIsCorrect] = useState(false);
	const [isAnswered, setIsAnswered] = useState(false);
	const [selectedRating, setSelectedRating] = useState(null);
	const [memoryMode, setMemoryMode] = useState(null); // 'short' or 'long'
	const [quizStarted, setQuizStarted] = useState(false);
	const [selectedTags, setSelectedTags] = useState([]);
	const [optionOrder, setOptionOrder] = useState([]);
	const [newQuestionLimit, setNewQuestionLimit] = useState(DEFAULT_NEW_QUESTION_LIMIT);
	const [newQuestionsIntroduced, setNewQuestionsIntroduced] = useState(0);
	const [deadlineSettings, setDeadlineSettings] = useState(loadDeadlineSettings);
	const [planningNow, setPlanningNow] = useState(() => new Date());
	const [retries, setRetries] = useState({});
	const [answeredCount, setAnsweredCount] = useState(0);
	const [additionalLearning, setAdditionalLearning] = useState(false);
	const answerCounter = useRef(0);
	const blockedIndexes = useMemo(() => blockedRetries(retries, answeredCount, planningNow), [retries, answeredCount, planningNow]);
	const timeBlockedIndexes = useMemo(() => blockedRetries(retries, answeredCount, planningNow, true), [retries, answeredCount, planningNow]);
	const deadline = typeof deadlineSettings.deadline === 'string' ? deadlineSettings.deadline : '';
	const dailyLimit = Number(deadlineSettings.dailyLimit) || 30;
	const targetRetention = Number(deadlineSettings.targetRetention) || 0.9;
	const scope = JSON.stringify([selectedTags.slice().sort(), questions.map(q => [q.problem, q.tags])]);
	const day = localDate(planningNow);
	const ledgerKey = JSON.stringify([scope, day]);
	const today = deadlineSettings.ledger?.[ledgerKey] || { answers: 0, newCount: 0 };
	const goalConfig = JSON.stringify([deadline, targetRetention, dailyLimit, DAILY_GOAL_VERSION]);
	const storedGoal = today.goal?.config === goalConfig ? today.goal : null;
	const answersToday = today.answers;
	const newToday = today.newCount;
	const startedOn = deadlineSettings.startedOn || day;
	const deadlinePlan = useMemo(() => {
		if (memoryMode !== 'deadline') return null;
		const options = { deadline, dailyLimit, targetRetention, selectedTags, now: planningNow,
			today: { answers: answersToday, newCount: newToday }, startedOn,
			newQuestionGoal: storedGoal?.newQuestions ?? Infinity };
		const plan = getDeadlinePlan(questions, { ...options, blockedIndexes });
		return plan?.candidates.length ? plan : getDeadlinePlan(questions, { ...options, blockedIndexes: timeBlockedIndexes });
	}, [questions, memoryMode, deadline, dailyLimit, targetRetention, selectedTags,
		planningNow, answersToday, newToday, startedOn, blockedIndexes, timeBlockedIndexes, storedGoal]);
	const workload = useMemo(() => memoryMode === 'deadline' ? estimateDeadlineWorkload(questions, {
		now: planningNow, end: deadlineDate(deadline), targetRetention, selectedTags,
	}) : null, [questions, memoryMode, planningNow, deadline, targetRetention, selectedTags]);
	const remainingDays = Math.max(1, Math.ceil((deadlineDate(deadline) - planningNow) / 86400000));
	const dailyGoal = storedGoal || (deadlinePlan ? createDailyGoal({ dailyLimit,
		answersToday, newToday, remainingDays, workload, plan: deadlinePlan }) : null);
	const dailyGoalReached = memoryMode === 'deadline' && dailyGoal && answersToday >= dailyGoal.answers;
	const dailyCheckpoint = dailyGoalReached && !additionalLearning && deadlinePlan?.count > 0 && deadlinePlan?.status !== 'expired';
	useEffect(() => { setAdditionalLearning(false); }, [ledgerKey, goalConfig]);
	useEffect(() => {
		if (!quizStarted || memoryMode !== 'deadline' || storedGoal || !dailyGoal || deadlinePlan?.status === 'expired') return;
		setDeadlineSettings(previous => ({ ...previous, ledger: { ...previous.ledger,
			[ledgerKey]: { ...previous.ledger?.[ledgerKey], answers: answersToday, newCount: newToday,
				goal: { ...dailyGoal, config: goalConfig } },
		} }));
	}, [quizStarted, memoryMode, storedGoal, dailyGoal, deadlinePlan?.status, ledgerKey, goalConfig, answersToday, newToday]);
	useEffect(() => {
		if (!quizStarted && memoryMode !== 'deadline') return;
		const timer = setInterval(() => setPlanningNow(new Date()), 10000);
		return () => clearInterval(timer);
	}, [memoryMode, quizStarted]);
	const updateDeadline = values => setDeadlineSettings(previous => ({ ...previous, ...values }));
	useEffect(() => { saveDeadlineSettings(deadlineSettings); }, [deadlineSettings]);

	const currentQuestion = currentQuestionIndex !== null ? questions[currentQuestionIndex] : null;

	const queueOptions = { memoryMode, selectedTags, now: planningNow, newQuestionsRemaining: newQuestionLimit - newQuestionsIntroduced, blockedIndexes };
	const remainingCount = memoryMode === 'deadline' ? deadlinePlan?.count || 0 : getQuestionQueue(questions, queueOptions).count;
	const waitingDates = questions.flatMap((question, index) => {
		if (selectedTags.length && !selectedTags.some(tag => question.tags?.includes(tag))) return [];
		const retry = retries[index];
		if (retry && retry.notBefore > planningNow.getTime()) return [retry.notBefore];
		if (memoryMode !== 'infinite' && [State.Learning, State.Relearning].includes(question.card.state)) {
			const due = normalizeFsrsCard(question.card).due.getTime();
			if (due > planningNow.getTime()) return [due];
		}
		return [];
	});
	const waitingUntil = memoryMode === 'deadline' ? deadlinePlan?.nextReviewAt
		: waitingDates.length ? new Date(Math.min(...waitingDates)) : null;
	const deadlineHeading = deadlinePlan?.status === 'target_met' ? '全問が目標記憶率以上です（推定）'
		: deadlinePlan?.status === 'expired' ? '目標日を過ぎました'
		: deadlinePlan?.status === 'empty' ? '対象の問題がありません'
		: '復習待ちです';
	useEffect(() => {
		if (quizStarted && memoryMode === 'deadline' && deadlinePlan?.status === 'expired') {
			setCurrentQuestionIndex(null);
			setIsAnswered(false);
			setSelectedRating(null);
		}
	}, [quizStarted, memoryMode, deadlinePlan?.status]);

	useEffect(() => {
		if (currentQuestionIndex == null && selectNextQuestionIndex() !== null) {
			setNextQuestionIndex();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [questions, planningNow, additionalLearning]);

	const selectNextQuestionIndex = (continueAdditional = false) => {
		if (memoryMode === 'deadline') {
			if (dailyCheckpoint && !continueAdditional) return null;
			const candidates = deadlinePlan?.candidates || [];
			return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
		}
		return selectQuestionIndex(questions, queueOptions) ?? selectQuestionIndex(questions, { ...queueOptions, blockedIndexes: timeBlockedIndexes });
	}

	const setNextQuestionIndex = (continueAdditional = false) => {
		const nextIndex = selectNextQuestionIndex(continueAdditional);
		setCurrentQuestionIndex(nextIndex);
		setIsAnswered(false);
		setIsCorrect(false);
		setSelectedRating(null);
		if (questions[nextIndex]?.random === true) {
			setOptionOrder(questions[nextIndex].options.map((_, i) => i).sort(() => Math.random() - 0.5));
		}
	}

	const startQuiz = () => {
		setQuizStarted(true);
		setNextQuestionIndex();
	};

	useEffect(() => {
		if (!isAnswered) return;
		answerCounter.current += 1;
		setAnsweredCount(answerCounter.current);
		if (!isCorrect) {
			setRetries(previous => ({ ...previous, [currentQuestionIndex]: {
				notBefore: Date.now() + RETRY_WAIT_MS,
				afterAnswers: answerCounter.current + RETRY_OTHER_ANSWERS,
			} }));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAnswered]);

	// 学習履歴を更新
	useEffect(() => {
		if (isAnswered && selectedRating && memoryMode !== 'infinite') {
			if (memoryMode === 'deadline') {
				const isNew = questions[currentQuestionIndex].card.reps === 0;
				setDeadlineSettings(previous => {
					const record = previous.ledger?.[ledgerKey] || { answers: 0, newCount: 0 };
					return { ...previous, ledger: { ...previous.ledger, [ledgerKey]: { ...record,
						answers: record.answers + 1, newCount: record.newCount + (isNew ? 1 : 0),
					} } };
				});
			}
			if (questions[currentQuestionIndex].card.reps === 0) {
				setNewQuestionsIntroduced(count => count + 1);
			}
			const params = generatorParameters({ 
				enable_short_term: memoryMode === 'short' || memoryMode === 'deadline',
				maximum_interval: 30*3
			});
			const f = fsrs(params);
			const reviewedAt = new Date();
			setQuestions(prevQuestions => {
				const newQuestions = [...prevQuestions];
				const item = f.next(normalizeFsrsCard(newQuestions[currentQuestionIndex].card), reviewedAt, selectedRating);
				newQuestions[currentQuestionIndex] = {
					...newQuestions[currentQuestionIndex],
					card: selectedRating === Rating.Again ? delayRetry(item.card, reviewedAt) : item.card
				}
				return newQuestions;
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAnswered, selectedRating]);

	const Qtype = {
		[QUESTION_TYPES.MULTIPLE_CHOICE]: MultipleChoiceQuestion,
		[QUESTION_TYPES.MULTIPLE_RESPONSE]: MultipleResponseQuestion,
		[QUESTION_TYPES.ORDERING]: OrderingQuestion,
		[QUESTION_TYPES.WORD]: WordQuestion
	}[currentQuestion == null ? null : currentQuestion.type] || MultipleChoiceQuestion;

  return (
		<div>
			{!quizStarted && (
				<div className="container mt-4">
					<div className='card p-4 shadow-sm mb-4'>
						<p className="text-center mb-3">記憶モードを選んでください</p>
						<div className="d-flex flex-wrap justify-content-center gap-3 mb-3">
							<button
								className={`btn ${memoryMode === 'infinite' ? 'btn-secondary' : 'btn-outline-secondary'}`}
								onClick={() => setMemoryMode('infinite')}
							>
								無限
							</button>
							<button
								className={`btn ${memoryMode === 'short' ? 'btn-success' : 'btn-outline-success'}`}
								onClick={() => setMemoryMode('short')}
							>
								短期記憶
							</button>
							<button
								className={`btn ${memoryMode === 'long' ? 'btn-primary' : 'btn-outline-primary'}`}
								onClick={() => setMemoryMode('long')}
							>
								長期記憶
							</button>
							<button className={`btn ${memoryMode === 'deadline' ? 'btn-warning' : 'btn-outline-warning'}`}
								onClick={() => setMemoryMode('deadline')}>期限付き</button>
						</div>

						<div className="mb-4">
							<p>出題するタグを選んでください（OR条件）</p>
							<TagSelector 
								selectedTags={selectedTags} 
								setSelectedTags={setSelectedTags} 
								allTags={Array.from(new Set(questions.flatMap(q => q.tags)))}
							/>
						</div>

						{memoryMode === 'deadline' && (
							<div className="mb-4">
								<label htmlFor="learning-deadline" className="form-label">目標日</label>
								<input id="learning-deadline" className="form-control mb-3" type="date" min={day} value={deadline}
									onChange={event => updateDeadline({ deadline: event.target.value, startedOn: day })} />
								<label htmlFor="daily-limit" className="form-label">1日の回答数の目安</label>
								<input id="daily-limit" className="form-control mb-3" type="number" min="1" max="1000" value={dailyLimit}
									onChange={event => updateDeadline({ dailyLimit: Math.min(1000, Math.max(1, Math.floor(Number(event.target.value) || 1))) })} />
								<label htmlFor="target-retention" className="form-label">目標記憶率</label>
								<select id="target-retention" className="form-select" value={targetRetention}
									onChange={event => updateDeadline({ targetRetention: Number(event.target.value) })}>
									<option value="0.8">80%</option><option value="0.9">90%</option><option value="0.95">95%</option>
								</select>
							</div>
						)}
						{memoryMode && !['infinite', 'deadline'].includes(memoryMode) && (
							<div className="mb-4">
								<label htmlFor="new-question-limit" className="form-label">今回の新規問題の上限</label>
								<input id="new-question-limit" type="number" min="0" max="1000" step="1"
									className="form-control" value={newQuestionLimit}
									onChange={event => setNewQuestionLimit(Math.min(1000, Math.max(0, Math.floor(Number(event.target.value) || 0))))} />
							</div>
						)}
						<button
							className="btn btn-dark"
							onClick={startQuiz}
							disabled={!memoryMode || (memoryMode === 'deadline' && (!deadlinePlan || deadlinePlan.status === 'expired'))}
						>
							クイズを開始
						</button>
					</div>
				</div>
			)}
			{deadlinePlan && (
				<div className="container mt-3" aria-live="polite">
					{deadlinePlan.status === 'target_met' ? <p>全体目標に到達したため、今日の追加回答は不要です（推定）。</p> : <>
					<h5>今日の目標 {dailyGoal.answers} 回答</h5>
					<p>1日の学習目安：{dailyGoal.answers} 回答{dailyGoal.estimated ? '（復習込みの試算）' : '（暫定）'}</p>
					<p>完了 {today.answers} 回答・あと {Math.max(0, dailyGoal.answers - today.answers)} 回答</p>
					<progress aria-label="今日の学習進捗" style={{ width: '100%' }}
						max={Math.max(1, dailyGoal.answers)} value={Math.min(today.answers, dailyGoal.answers)} />
					</>}
					{!dailyGoal.estimated && <p role="status">必要回答数を試算できないため暫定の目安です。このペースで期限に間に合うかは確認できていません。</p>}
					{deadlinePlan.cannotRetryBeforeDeadline && <p role="status" className="text-danger">期限前に再学習できない問題があります。</p>}
					<details className="mt-2">
					<summary>期限までの全体進捗</summary>
					<p>目標日 {deadline} · 目標記憶率以上（推定） {deadlinePlan.ready} / {deadlinePlan.total} 問</p>
					<p>今後復習しない場合の目標日の予測記憶率 {Math.round(deadlinePlan.predictedRetention * 100)}%</p>
					<p>未達 {deadlinePlan.count} 問 · 未学習 {deadlinePlan.unseen} 問 · 今日の回答 {today.answers} 回（目安 {dailyLimit} 回）</p>
					<p>未達問題へ1回ずつ回答する分：{deadlinePlan.minimumAdditionalAnswers} 回（復習を含まない下限）</p>
					{workload && <div aria-label="必要回答数の試算">
						{workload.good.remainingAnswers !== null
							? <p>今後すべて「普通」で正答：残り約 {workload.good.remainingAnswers} 回・1日平均 {workload.good.answersPerDay} 回</p>
							: <p role="status" className="text-danger">正答が続く想定でも、期限内の到達を試算できない問題が {workload.good.unresolved + workload.good.invalid} 問あります。</p>}
						{workload.oneFailure.remainingAnswers !== null
							? <p>未達の各問題で最初に1回誤答し、その後「普通」で正答：残り約 {workload.oneFailure.remainingAnswers} 回・1日平均 {workload.oneFailure.answersPerDay} 回</p>
							: <p>各問題で1回誤答する想定では、期限内の到達を試算できない問題が {workload.oneFailure.unresolved + workload.oneFailure.invalid} 問あります。</p>}
						{workload.good.answersPerDay > dailyLimit && <p role="status" className="text-danger">正答が続く試算でも、1日平均の必要回答数が設定した目安を超えています。</p>}
					</div>}
					{deadlinePlan.exceededDailyGoal && <p role="status">回答数の目安に達しましたが、未達の問題があるため学習を続けられます。</p>}
					{deadlinePlan.overloaded && <p role="status" className="text-danger">必要回答数の下限が1日の目安を超えています。追加の学習が必要です。</p>}
					{deadlinePlan.cannotRetryBeforeDeadline && <p role="status" className="text-danger">期限前に再学習できない問題が残っています。期限内の目標達成を見込めません。</p>}
					</details>
				</div>
			)}
			{quizStarted && currentQuestionIndex === null && (
				<div className="text-center mt-5">
					<h4>{dailyCheckpoint ? '今日の目標を達成しました' : memoryMode === 'deadline' ? deadlineHeading : waitingUntil ? '復習待ちです' : '今回の学習を終えました！'}</h4>
					{dailyCheckpoint && <>
						<p>今日の完了 {today.answers} 回答</p>
						<button className="btn btn-primary" onClick={() => {
							setAdditionalLearning(true);
							setNextQuestionIndex(true);
						}}>追加学習する</button>
					</>}
					{memoryMode === 'deadline' && deadlinePlan?.status === 'target_met' && <p>FSRSの推定値です。期限当日の全問正答を保証するものではありません。</p>}
					{memoryMode === 'deadline' && deadlinePlan?.status === 'expired' && <p>未達の問題が {deadlinePlan?.count || 0} 問残っています。</p>}
					{waitingUntil && deadlinePlan?.status !== 'expired' && <p>次の復習 {waitingUntil.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
				</div>
			)}
			{quizStarted && currentQuestionIndex !== null && (
				<div className="container mt-4">
					<div className="card p-4 shadow-sm">
						{!['infinite', 'deadline'].includes(memoryMode) && (<h5 className='text-end bm-4'>残り {remainingCount} 問</h5>)}
						<h5 className="text-center mb-4">{memoryMode === 'deadline' ? '問題' : `問題 ${currentQuestionIndex + 1} / ${questions.length}`}</h5>
						<Qtype
							question={currentQuestion}
							optionOrder={optionOrder}
							isCorrect={isCorrect}
							setIsCorrect={setIsCorrect}
							setNextQuestionIndex={setNextQuestionIndex}
							isAnswered={isAnswered}
							setIsAnswered={setIsAnswered}
							selectedRating={selectedRating}
							setSelectedRating={setSelectedRating}
							memoryMode={memoryMode}
						/>
					</div>
				</div>
			)}
		</div>
  );
};

export default Question;
