import React, { useState } from 'react';
import Option from './Option';

const Question = ({ questions }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isCorrect, setIsCorrect] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="container mt-4">
            <div className="card p-4 shadow-sm">
                <Option
                    question={currentQuestion}
                    isCorrect={isCorrect}
                    setIsCorrect={setIsCorrect}
                    setCurrentQuestionIndex={setCurrentQuestionIndex}
                    q_length={questions.length}
                />
            </div>
        </div>
    );
};

export default Question;
