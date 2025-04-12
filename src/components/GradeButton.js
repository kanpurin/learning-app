import React from 'react';

const GradeButton = ({ selectedGrade, setSelectedGrade }) => {
  return (
    <div
      className="d-grid gap-2 mt-3"
      style={{ gridTemplateColumns: 'repeat(4, 1fr)', display: 'grid' }}
    >
      <button
        className={`btn w-100 ${selectedGrade === 1 ? 'btn-secondary' : 'btn-outline-secondary'}`}
        onClick={() => setSelectedGrade(1)}
        disabled={selectedGrade !== null}
      >
        もう一回
      </button>
      <button
        className={`btn w-100 ${selectedGrade === 2 ? 'btn-danger' : 'btn-outline-danger'}`}
        onClick={() => setSelectedGrade(2)}
        disabled={selectedGrade !== null}
      >
        難しい
      </button>
      <button
        className={`btn w-100 ${selectedGrade === 3 ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => setSelectedGrade(3)}
        disabled={selectedGrade !== null}
      >
        普通
      </button>
      <button
        className={`btn w-100 ${selectedGrade === 4 ? 'btn-success' : 'btn-outline-success'}`}
        onClick={() => setSelectedGrade(4)}
        disabled={selectedGrade !== null}
      >
        簡単
      </button>
    </div>
  );
};

export default GradeButton;