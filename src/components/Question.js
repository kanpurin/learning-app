import React, { useState, useEffect } from 'react';
import MultipleChoiceQuestion from './MultipleChoiceQuestion/MultipleChoiceQuestion';
import MultipleResponseQuestion from './MultipleResponseQuestion/MultipleResponseQuestion';
import OrderingQuestion from './OrderingQuestion/OrderingQuestion';
import WordQuestion from './WordQuestion/WordQuestion';
import { fsrs, generatorParameters } from 'ts-fsrs';
import TagSelector from './TagSelector';

const Question = ({ questions, setQuestions }) => {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [isCorrect, setIsCorrect] = useState(false);
	const [isAnswered, setIsAnswered] = useState(false);
	const [selectedRating, setSelectedRating] = useState(null);
	const [memoryMode, setMemoryMode] = useState(null); // 'short' or 'long'
	const [quizStarted, setQuizStarted] = useState(false);
	const [selectedTags, setSelectedTags] = useState([]);
	const [optionOrder, setOptionOrder] = useState([]);

	const currentQuestion = currentQuestionIndex !== null ? questions[currentQuestionIndex] : null;

	useEffect(() => {
		if (currentQuestionIndex == null && selectNextQuestionIndex() !== null) {
			setNextQuestionIndex();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [questions]);

	const selectNextQuestionIndex = () => {
		if (questions.length === 0) return null;
		if (memoryMode !== 'infinite') {
			const now = new Date();
			const unseenIndexes = questions
				.map((q, i) => {
					const tagMatch = selectedTags.length === 0 || selectedTags.some(tag => q.tags?.includes(tag));
					if (!tagMatch) return -1;
					return q.card.reps === 0 ? i : -1;
				})
				.filter(i => i !== -1);
			if (unseenIndexes.length > 0) {
				return unseenIndexes[Math.floor(Math.random() * unseenIndexes.length)];
			}
			else {
				const dueIndexes = questions
					.map((q, i) => {
						const tagMatch = selectedTags.length === 0 || selectedTags.some(tag => q.tags?.includes(tag));
						if (!tagMatch) return -1;
						return new Date(q.card.due) <= now ? i : -1
					})
					.filter(i => i !== -1);
				if (dueIndexes.length > 0) {
					return dueIndexes[Math.floor(Math.random() * dueIndexes.length)];
				}
				else {
					return null;
				}
			}
		}
		else {
			// すべての問題からランダムに1問選ぶ
			return Math.floor(Math.random() * questions.length);
		}
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
			const params = generatorParameters({ 
				enable_short_term: memoryMode === 'short', 
				maximum_interval: 30*3
			});
			const f = fsrs(params);
			setQuestions(prevQuestions => {
				const newQuestions = [...prevQuestions];
				const item = f.next(newQuestions[currentQuestionIndex].card, new Date(), selectedRating);
				console.log(item.log);
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
		mcq: MultipleChoiceQuestion,
		mrq: MultipleResponseQuestion,
		order: OrderingQuestion,
		word: WordQuestion
	}[currentQuestion == null ? null : currentQuestion.type] || MultipleChoiceQuestion;

  return (
		<div>
			{!quizStarted && (
				<div className="container mt-4">
					<div className='card p-4 shadow-sm mb-4'>
						<p className="text-center mb-3">記憶モードを選んでください</p>
						<div className="d-flex justify-content-center gap-3 mb-3">
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
						</div>

						<div className="mb-4">
							<p>出題するタグを選んでください（OR条件）</p>
							<TagSelector 
								selectedTags={selectedTags} 
								setSelectedTags={setSelectedTags} 
								allTags={Array.from(new Set(questions.flatMap(q => q.tags)))}
							/>
						</div>

						<button
							className="btn btn-dark"
							onClick={startQuiz}
							disabled={!memoryMode}
						>
							クイズを開始
						</button>
					</div>
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
