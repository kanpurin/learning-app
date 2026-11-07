import { interleavedCandidates } from './interleavedQueue';

test('every nonempty group gets a slot within each three answers', () => {
  const groups = [[{ index: 0 }], [{ index: 1 }], [{ index: 2 }]];
  expect(Array.from({ length: 12 }, (_, turn) => interleavedCandidates(groups, turn)[0].index))
    .toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2]);
});

test('empty groups yield their slots and each group rotates its least-shown cards', () => {
  const groups = [[], [{ index: 0 }, { index: 1 }], []];
  expect(interleavedCandidates(groups, 0, { 0: 9, 1: 1 })).toEqual([{ index: 1 }]);
  expect(interleavedCandidates([[], [], []], 2)).toEqual([]);
});
