import { FSPS5_w } from './constants';

export function initStability(grade) {
  return FSPS5_w[grade - 1];
}

export function nextStability_r(difficulty, stability, recall, grade) {
	return stability * (Math.exp(FSPS5_w[8]) * (11 - difficulty) * Math.pow(stability, -FSPS5_w[9]) * (Math.exp(FSPS5_w[10] * (1 - recall)) - 1) * (grade === 2 ? FSPS5_w[15] : 1) * (grade === 4 ? FSPS5_w[16] : 1) + 1);
}

export function nextStability_f(difficulty, stability, recall) {
	return FSPS5_w[11] * Math.pow(difficulty, -FSPS5_w[12]) * (Math.pow(stability + 1, FSPS5_w[13]) - 1) * Math.exp(FSPS5_w[14] * (1 - recall));
}

export function nextStability_short(stability, grade) {
	return stability * Math.exp(FSPS5_w[17] * (grade - 3 + FSPS5_w[18]));
}

export function initDifficulty(grade) {
  return FSPS5_w[4] - Math.exp(FSPS5_w[5] * (grade - 1)) + 1;
}

export function nextDifficulty(difficulty, grade) {
	return FSPS5_w[7] * initDifficulty(4) + (1 - FSPS5_w[7]) * (difficulty - FSPS5_w[6] * (grade - 3));
}