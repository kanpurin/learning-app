import React, { useState, useEffect } from 'react';
import MultipleChoiceQuestion from './MultipleChoiceQuestion/MultipleChoiceQuestion';
import MultipleResponseQuestion from './MultipleResponseQuestion/MultipleResponseQuestion';
import OrderingQuestion from './OrderingQuestion/OrderingQuestion';

const Question = ({ questions, setQuestions }) => {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [isCorrect, setIsCorrect] = useState(false);
	const [isAnswered, setIsAnswered] = useState(false);

	const currentQuestion = questions[currentQuestionIndex];

	const alpha = 0.2;	// 正解時のS_i減衰率
	const beta = 0.3;		// 不正解時のS_i上昇率
	const tau = 10;			// 経過回数に対する割引パラメータ

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
		const nextIndex = selectNextQuestionIndex();
		setCurrentQuestionIndex(nextIndex);
	}

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
  );
};

export default Question;
