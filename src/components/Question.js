import React, { useState, useEffect } from 'react';
import MultipleChoiceQuestion from './MultipleChoiceQuestion/MultipleChoiceQuestion';
import MultipleResponseQuestion from './MultipleResponseQuestion/MultipleResponseQuestion';
import OrderingQuestion from './OrderingQuestion/OrderingQuestion';
import WordQuestion from './WordQuestion/WordQuestion';
import { fsrs, generatorParameters } from 'ts-fsrs';
import TagSelector from './TagSelector';
import { QUESTION_TYPES } from '../constants/questionTypes';
import { DEFAULT_NEW_QUESTION_LIMIT, getQuestionQueue, selectQuestionIndex } from '../lib/questionRecommendation';
import { getDeadlinePlan, loadDeadlineSettings, localDate, saveDeadlineSettings } from '../lib/deadlinePlan';

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
	const deadline = typeof deadlineSettings.deadline === 'string' ? deadlineSettings.deadline : '';
	const dailyLimit = Number(deadlineSettings.dailyLimit) || 30;
	const targetRetention = Number(deadlineSettings.targetRetention) || 0.9;
	const scope = JSON.stringify([selectedTags.slice().sort(), questions.map(q => [q.problem, q.tags])]);
	const day = localDate();
	const ledgerKey = JSON.stringify([scope, day]);
	const today = deadlineSettings.ledger?.[ledgerKey] || { answers: 0, newCount: 0 };
	const deadlinePlan = memoryMode === 'deadline' ? getDeadlinePlan(questions, {
		deadline, dailyLimit, targetRetention, selectedTags, today,
		startedOn: deadlineSettings.startedOn || day,
	}) : null;
	const updateDeadline = values => setDeadlineSettings(previous => ({ ...previous, ...values }));
	useEffect(() => { saveDeadlineSettings(deadlineSettings); }, [deadlineSettings]);

	const currentQuestion = currentQuestionIndex !== null ? questions[currentQuestionIndex] : null;

	const queueOptions = { memoryMode, selectedTags, newQuestionsRemaining: newQuestionLimit - newQuestionsIntroduced };
	const remainingCount = memoryMode === 'deadline' ? deadlinePlan?.count || 0 : getQuestionQueue(questions, queueOptions).count;

	useEffect(() => {
		if (currentQuestionIndex == null && selectNextQuestionIndex() !== null) {
			setNextQuestionIndex();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [questions]);

	const selectNextQuestionIndex = () => {
		if (memoryMode === 'deadline') {
			const candidates = deadlinePlan?.candidates || [];
			return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
		}
		return selectQuestionIndex(questions, queueOptions);
	}

	const setNextQuestionIndex = () => {
		const nextIndex = selectNextQuestionIndex();
		setCurrentQuestionIndex(nextIndex);
		if (questions[nextIndex]?.random === true) {
			setOptionOrder(questions[nextIndex].options.map((_, i) => i).sort(() => Math.random() - 0.5));
		}
	}

	const startQuiz = () => {
		setQuizStarted(true);
		setNextQuestionIndex();
	};

	// 学習履歴を更新
	useEffect(() => {
		if (isAnswered && selectedRating && memoryMode !== 'infinite') {
			if (memoryMode === 'deadline') {
				const isNew = questions[currentQuestionIndex].card.reps === 0;
				setDeadlineSettings(previous => {
					const record = previous.ledger?.[ledgerKey] || { answers: 0, newCount: 0 };
					return { ...previous, ledger: { ...previous.ledger, [ledgerKey]: {
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
			setQuestions(prevQuestions => {
				const newQuestions = [...prevQuestions];
				const item = f.next(newQuestions[currentQuestionIndex].card, new Date(), selectedRating);
				newQuestions[currentQuestionIndex] = {
					...newQuestions[currentQuestionIndex],
					card: item.card
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
								<label htmlFor="daily-limit" className="form-label">1日の回答数の上限</label>
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
							disabled={!memoryMode || (memoryMode === 'deadline' && !deadlinePlan)}
						>
							クイズを開始
						</button>
					</div>
				</div>
			)}
			{deadlinePlan && (
				<div className="container mt-3" aria-live="polite">
					<p>目標日 {deadline} · 目標達成見込み {deadlinePlan.ready} / {deadlinePlan.total} 問</p>
					<p>目標日の推定記憶率 {Math.round(deadlinePlan.predictedRetention * 100)}% · 未学習 {deadlinePlan.unseen} 問</p>
					<p>今日の新規目標 {deadlinePlan.newGoal} 問 · 回答済み {today.answers} / {dailyLimit} 回</p>
					{deadlinePlan.overloaded && <p role="status" className="text-danger">新規問題だけで1日の上限を超えています。回答数の上限または目標日を見直してください。</p>}
				</div>
			)}
			{quizStarted && currentQuestionIndex === null && (
				<div className="text-center mt-5">
					<h4>今回の学習を終えました！</h4>
				</div>
			)}
			{quizStarted && currentQuestionIndex !== null && (
				<div className="container mt-4">
					<div className="card p-4 shadow-sm">
						{memoryMode !== 'infinite' && (<h5 className='text-end bm-4'>残り {remainingCount} 問</h5>)}
						<h5 className="text-center mb-4">問題 {currentQuestionIndex + 1} / {questions.length}</h5>
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
