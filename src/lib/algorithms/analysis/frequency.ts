import { DrawRecord, FrequencyResult } from '../types';

/**
 * Get historical frequency analysis for hot/cold numbers
 * Pure function that only depends on input parameters (IoC pattern)
 */
export function getHistoricalFrequency(
  historicalDraws: DrawRecord[],
  analysisType: 'hot' | 'cold'
): FrequencyResult[] {
  if (!historicalDraws || historicalDraws.length === 0) {
    throw new Error('No historical data provided');
  }

  // Count frequency of each number
  const frequencyMap = new Map<number, number>();

  // Initialize all numbers 1-49 with frequency 0
  for (let i = 1; i <= 49; i++) {
    frequencyMap.set(i, 0);
  }

  for (const draw of historicalDraws) {
    // Count winning numbers
    for (const num of draw.winningNumbers) {
      frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
    }
    // Count special number
    frequencyMap.set(draw.specialNumber, (frequencyMap.get(draw.specialNumber) || 0) + 1);
  }

  // Convert to array and sort based on analysis type
  const frequencyArray = Array.from(frequencyMap.entries())
    .map(([number, frequency]) => ({ number, frequency }));

  if (analysisType === 'hot') {
    frequencyArray.sort((a, b) => b.frequency - a.frequency);
  } else {
    frequencyArray.sort((a, b) => a.frequency - b.frequency);
  }

  return frequencyArray;
}