import { differenceInDays, isSameDay } from 'date-fns';
import React, { useState, useEffect } from 'react';
import { tau, alpha, beta } from '../constants';
import { initStability, nextStability_f, nextStability_r, nextStability_short, initDifficulty, nextDifficulty } from '../utils';
import MultipleChoiceQuestion from './MultipleChoiceQuestion/MultipleChoiceQuestion';
import MultipleResponseQuestion from './MultipleResponseQuestion/MultipleResponseQuestion';
import OrderingQuestion from './OrderingQuestion/OrderingQuestion';

const Question = ({ questions, setQuestions }) => {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [isCorrect, setIsCorrect] = useState(false);
	const [isAnswered, setIsAnswered] = useState(false);
	const [selectedGrade, setSelectedGrade] = useState(null);
	const [memoryMode, setMemoryMode] = useState(null); // 'short' or 'long'
	const [quizStarted, setQuizStarted] = useState(false);

	const currentQuestion = currentQuestionIndex !== null ? questions[currentQuestionIndex] : null;

	useEffect(() => {
		if (currentQuestionIndex === null && selectNextQuestionIndex() !== null) {
			setNextQuestionIndex();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [questions]);

	const selectNextQuestionIndex = () => {
		let totalWeight = 0;
		let weights = questions.map((q, index) => {
			// recallの計算
			const now = new Date();
			const lastAnsweredDate = new Date(q.lastAnsweredDate);
			const daysElapsed = differenceInDays(now, lastAnsweredDate);
			const decay = -0.5;
			const factor = 19 / 81;
			const recall = Math.pow(1 + factor * daysElapsed / q.stability, decay);
	
			// memoryModeがlongの場合、recallが0.9未満の問題だけを対象
			if (memoryMode === 'long' && recall >= 0.9) {
				return null; // recallが0.9以上ならスキップ
			}
	
			let D = 1 - Math.exp(-q.gap / tau);
			let W = q.priority * D;
			totalWeight += W;
			return { index, weight: W };
		}).filter(weight => weight !== null); // nullをフィルタリング
	
		// 重みを元に次の問題を選ぶ
		let rand = Math.random() * totalWeight;
		let sum = 0;
		for (let { index, weight } of weights) {
			sum += weight;
			if (rand <= sum) {
				return index;
			}
		}
		return null; // 念のため最後の要素
	};

	const setNextQuestionIndex = () => {
		setQuestions(prevQuestions => prevQuestions.filter(q => !q.deleted));
		const nextIndex = selectNextQuestionIndex();
		setCurrentQuestionIndex(nextIndex);
	}

	const startQuiz = () => {
		setQuizStarted(true);
		setNextQuestionIndex();
	};

	// 学習履歴を更新
	useEffect(() => {
		if (isAnswered && selectedGrade) {
			setQuestions((prevQuestions) => {
				return prevQuestions.map((q, index) => {
					if (index === currentQuestionIndex) {
						const newAttempts = q.attempts + 1;
						const newCorrectCount = isCorrect ? q.correctCount + 1 : q.correctCount;
						const newPriority = q.priority * (isCorrect ? 1 - alpha : 1 + beta);
						const grade = isCorrect ? selectedGrade : 1; // 1-4(間違えたら1)

						let newStability, newDifficulty;
						const now = new Date();

						if (q.lastAnsweredDate === null) {
							newStability = initStability(grade);
							newDifficulty = initDifficulty(grade);
						}
						else {
							const lastDate = new Date(q.lastAnsweredDate);
							const daysElapsed = differenceInDays(now, lastDate);
							const recall = 1 / (1 + daysElapsed / (9 * q.stability));
				
							if (isSameDay(now, lastDate)) {
								newStability = nextStability_short(q.stability, grade);
							} else if (isCorrect) {
								newStability = nextStability_r(q.difficulty, q.stability, recall, grade);
							} else {
								newStability = nextStability_f(q.difficulty, q.stability, recall);
							}
				
							newDifficulty = nextDifficulty(q.difficulty, grade);
						}
						return {
							...q,
							attempts: newAttempts,
							correctCount: newCorrectCount,
							priority: newPriority,
							gap: 0,
							stability: newStability,
							difficulty: newDifficulty,
							lastAnsweredDate: now.toISOString()
						};
					}
					else {
						const newGap = q.gap + 1;
						return {
							...q,
							gap: newGap
						};
					}
				});
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAnswered, selectedGrade]);

	const Qtype = {
		mcq: MultipleChoiceQuestion,
		mrq: MultipleResponseQuestion,
		order: OrderingQuestion
	}[currentQuestion === null ? null : currentQuestion.type] || MultipleChoiceQuestion;

  return (
		<div>
			{!quizStarted && (
				<div className="text-center mt-4">
					<p className="mb-3">記憶モードを選んでください</p>
					<div className="d-flex justify-content-center gap-3 mb-3">
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
					</div>
					<button
						className="btn btn-dark"
						onClick={startQuiz}
						disabled={!memoryMode}
					>
						クイズを開始
					</button>
				</div>
			)}
			{quizStarted && currentQuestionIndex === null && (
				<div className="text-center mt-5">
					<h4>すべての問題を解き終わりました！</h4>
				</div>
			)}
			{quizStarted && currentQuestionIndex !== null && (
				<div className="container mt-4">
					<div className="card p-4 shadow-sm">
						<Qtype
							question={currentQuestion}
							isCorrect={isCorrect}
							setIsCorrect={setIsCorrect}
							setNextQuestionIndex={setNextQuestionIndex}
							isAnswered={isAnswered}
							setIsAnswered={setIsAnswered}
							selectedGrade={selectedGrade}
							setSelectedGrade={setSelectedGrade}
							memoryMode={memoryMode}
						/>
					</div>
				</div>
			)}
		</div>
  );
};

export default Question;
