// Empty groups yield their slot; within a group, rotate through less-shown cards first.
export function interleavedCandidates(groups, turn = 0, presented = {}) {
  for (let offset = 0; offset < groups.length; offset++) {
    const group = groups[(turn + offset) % groups.length];
    if (!group.length) continue;
    const minimum = Math.min(...group.map(item => presented[item.index] || 0));
    return group.filter(item => (presented[item.index] || 0) === minimum);
  }
  return [];
}
