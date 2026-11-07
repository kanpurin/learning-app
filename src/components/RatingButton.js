import React from 'react';
import { Rating } from 'ts-fsrs';

const RatingButton = ({ selectedRating, setSelectedRating }) => {
  return (
    <div className="rating-grid">
      <button
        className={`btn w-100 ${selectedRating === Rating.Again ? 'btn-secondary' : 'btn-outline-secondary'}`}
        onClick={() => setSelectedRating(Rating.Again)}
        type="button"
        aria-pressed={selectedRating === Rating.Again}
      >
        もう一回
      </button>
      <button
        className={`btn w-100 ${selectedRating === Rating.Hard ? 'btn-danger' : 'btn-outline-danger'}`}
        onClick={() => setSelectedRating(Rating.Hard)}
        type="button"
        aria-pressed={selectedRating === Rating.Hard}
      >
        難しい
      </button>
      <button
        className={`btn w-100 ${selectedRating === Rating.Good ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => setSelectedRating(Rating.Good)}
        type="button"
        aria-pressed={selectedRating === Rating.Good}
      >
        普通
      </button>
      <button
        className={`btn w-100 ${selectedRating === Rating.Easy ? 'btn-success' : 'btn-outline-success'}`}
        onClick={() => setSelectedRating(Rating.Easy)}
        type="button"
        aria-pressed={selectedRating === Rating.Easy}
      >
        簡単
      </button>
    </div>
  );
};

export default RatingButton;
