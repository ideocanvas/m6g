import { RandomResult } from '../types';

/**
 * Generate random numbers (1-49)
 * This algorithm doesn't require database access or test data
 */
export function generateRandomNumbers(): RandomResult[] {
  const allNumbers = Array.from({ length: 49 }, (_, i) => i + 1);
  const shuffled = [...allNumbers].sort(() => Math.random() - 0.5);

  return shuffled.map((number) => ({
    number,
    random: Math.random()
  }));
}