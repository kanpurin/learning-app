import React, { useState, useEffect } from 'react';
import { tau, alpha, beta } from '../constants';
import MultipleChoiceQuestion from './MultipleChoiceQuestion/MultipleChoiceQuestion';
import MultipleResponseQuestion from './MultipleResponseQuestion/MultipleResponseQuestion';
import OrderingQuestion from './OrderingQuestion/OrderingQuestion';

const Question = ({ questions, setQuestions }) => {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [isCorrect, setIsCorrect] = useState(false);
	const [isAnswered, setIsAnswered] = useState(false);
	const [quizStarted, setQuizStarted] = useState(false);

	const currentQuestion = questions[currentQuestionIndex];

	const selectNextQuestionIndex = () => {
		let totalWeight = 0;
		let weights = questions.map((q, index) => {
			let D = 1 - Math.exp(-q.gap / tau);
			let W = q.priority * D;
			totalWeight += W;
			return { index, weight: W };
		});

		let rand = Math.random() * totalWeight;
		let sum = 0;
		console.log('priority:',questions.map(q => {return q.priority}));
		console.log('gap:',questions.map(q => {return q.gap}));
		console.log('wiehgt:',weights.map(q => {return q.weight}));
		for (let { index, weight } of weights) {
			sum += weight;
			if (rand <= sum) {
				return index;
			}
		}
		return questions.length - 1; // 念のため最後の要素
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

	// isAnswered が更新されたタイミングで学習履歴を更新
	useEffect(() => {
		if (isAnswered) {
			setQuestions((prevQuestions) => {
				return prevQuestions.map((q, index) => {
					if (index === currentQuestionIndex) {
						const newAttempts = q.attempts + 1;
						const newCorrectCount = isCorrect ? q.correctCount + 1 : q.correctCount;
						const newPriority = q.priority * (isCorrect ? 1 - alpha : 1 + beta);
						return {
							...q,
							attempts: newAttempts,
							correctCount: newCorrectCount,
							priority: newPriority,
							gap: 0
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
	}, [isAnswered]); // isAnswered の変更を監視

	const Qtype = {
		mcq: MultipleChoiceQuestion,
		mrq: MultipleResponseQuestion,
		order: OrderingQuestion
	}[currentQuestion.type] || MultipleChoiceQuestion;

  return (
		<div>
			{!quizStarted && (
				<div className="text-center mt-4">
					<button className="btn btn-primary" onClick={startQuiz}>
						クイズを開始
					</button>
				</div>
			)}
			{quizStarted && (
				<div className="container mt-4">
					<div className="card p-4 shadow-sm">
						<Qtype
							question={currentQuestion}
							isCorrect={isCorrect}
							setIsCorrect={setIsCorrect}
							setNextQuestionIndex={setNextQuestionIndex}
							isAnswered={isAnswered}
							setIsAnswered={setIsAnswered}
						/>
					</div>
				</div>
			)}
		</div>
  );
};

export default Question;
