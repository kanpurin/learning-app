import React from 'react';
import { Rating } from 'ts-fsrs';

const RatingButton = ({ selectedRating, setSelectedRating }) => {
  return (
    <div
      className="d-grid gap-2 mt-3"
      style={{ gridTemplateColumns: 'repeat(4, 1fr)', display: 'grid' }}
    >
      <button
        className={`btn w-100 ${selectedRating === Rating.Again ? 'btn-secondary' : 'btn-outline-secondary'}`}
        onClick={() => setSelectedRating(Rating.Again)}
        disabled={selectedRating !== null}
      >
        もう一回
      </button>
      <button
        className={`btn w-100 ${selectedRating === Rating.Hard ? 'btn-danger' : 'btn-outline-danger'}`}
        onClick={() => setSelectedRating(Rating.Hard)}
        disabled={selectedRating !== null}
      >
        難しい
      </button>
      <button
        className={`btn w-100 ${selectedRating === Rating.Good ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => setSelectedRating(Rating.Good)}
        disabled={selectedRating !== null}
      >
        普通
      </button>
      <button
        className={`btn w-100 ${selectedRating === Rating.Easy ? 'btn-success' : 'btn-outline-success'}`}
        onClick={() => setSelectedRating(Rating.Easy)}
        disabled={selectedRating !== null}
      >
        簡単
      </button>
    </div>
  );
};

export default RatingButton;