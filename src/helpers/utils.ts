import type { Predicate } from './types.js';

export const samePredicate = (a: Predicate = [], b: Predicate = []): boolean => {
  if (a.length === b.length) {
    const sortedA = a.sort();
    const sortedB = b.sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  }
  return false;
};
