import { BalancedResult } from './types';

/**
 * Generate balanced numbers across different ranges
 * This algorithm doesn't require database access or test data
 */
export function generateBalancedNumbers(): BalancedResult[] {
  const ranges = [
    { start: 1, end: 10, name: '1-10' },
    { start: 11, end: 20, name: '11-20' },
    { start: 21, end: 30, name: '21-30' },
    { start: 31, end: 40, name: '31-40' },
    { start: 41, end: 49, name: '41-49' },
  ];

  const balancedNumbers: BalancedResult[] = [];

  for (const range of ranges) {
    const rangeNumbers = Array.from(
      { length: range.end - range.start + 1 },
      (_, i) => range.start + i
    );
    const shuffled = [...rangeNumbers].sort(() => Math.random() - 0.5);

    // Take 2-3 numbers from each range for balanced distribution
    const numbersToTake = Math.ceil(49 / ranges.length);
    balancedNumbers.push(
      ...shuffled.slice(0, numbersToTake).map(number => ({
        number,
        range: range.name
      }))
    );
  }

  // Sort by number for consistent output
  return balancedNumbers.sort((a, b) => a.number - b.number);
}