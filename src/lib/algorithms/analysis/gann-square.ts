import { DrawRecord } from '../types';

/**
 * Represents a suggested number with its source/reasoning.
 */
export interface SuggestedNumber {
  number: number;
  reason: string;
}

/**
 * Generates a Gann Square for the 49 Mark Six numbers.
 * The numbers are arranged in a spiral starting from the center.
 * (This helper function remains unchanged)
 * @returns A 7x7 grid representing the Gann Square.
 */
export function generateGannSquare(): (number | null)[][] {
  const size = 7;
  const square: (number | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));
  let x = Math.floor(size / 2);
  let y = Math.floor(size / 2);
  let direction = 0; // 0: right, 1: up, 2: left, 3: down
  let steps = 1;
  let stepCount = 0;
  let turnCount = 0;

  for (let i = 1; i <= 49; i++) {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      square[y][x] = i;
    }

    switch (direction) {
      case 0:
        x++;
        break;
      case 1:
        y--;
        break;
      case 2:
        x--;
        break;
      case 3:
        y++;
        break;
    }

    stepCount++;
    if (stepCount === steps) {
      stepCount = 0;
      direction = (direction + 1) % 4;
      turnCount++;
      if (turnCount === 2) {
        turnCount = 0;
        steps++;
      }
    }
  }
  return square;
}


/**
 * Suggests lottery numbers based on the Gann Square method with distance-based ordering.
 * The logic is as follows:
 * 1. First return the last draw numbers (7 numbers)
 * 2. Then return numbers most close to the last draw numbers in the Gann Square
 * 3. Use frequency only as tie-breaker when distances are equal
 *
 * @param historicalDraws An array of historical draw records, with the last element being the most recent.
 * @returns An array of suggested numbers with the reason for their suggestion.
 */
export function suggestNumbersByGannSquare(historicalDraws: DrawRecord[]): SuggestedNumber[] {
  if (!historicalDraws || historicalDraws.length === 0) {
    throw new Error('No historical data provided');
  }

  const gannSquare = generateGannSquare();
  const recentDraw = historicalDraws[historicalDraws.length - 1];
  const lastDrawNumbers = [...recentDraw.winningNumbers, recentDraw.specialNumber];

  // Calculate number frequencies from recent draws (last 50 draws)
  const recentDraws = historicalDraws.slice(-50);
  const numberFrequencies = new Map<number, number>();

  for (let i = 1; i <= 49; i++) {
    numberFrequencies.set(i, 0);
  }

  for (const draw of recentDraws) {
    const allNumbers = [...draw.winningNumbers, draw.specialNumber];
    for (const num of allNumbers) {
      numberFrequencies.set(num, (numberFrequencies.get(num) || 0) + 1);
    }
  }

  // Step 1: Add last draw numbers first (7 numbers)
  const suggestions = new Map<number, SuggestedNumber>();

  for (const num of lastDrawNumbers) {
    if (!suggestions.has(num)) {
      suggestions.set(num, {
        number: num,
        reason: 'Last draw number',
      });
    }
  }

  // Step 2: Find numbers close to last draw numbers in Gann Square
  const closeNumbers = new Map<number, { distance: number, frequency: number }>();

  // Map number coordinates
  const numberCoords = new Map<number, { y: number; x: number }>();
  for (let y = 0; y < gannSquare.length; y++) {
    for (let x = 0; x < gannSquare[y].length; x++) {
      const num = gannSquare[y][x];
      if (num) {
        numberCoords.set(num, { y, x });
      }
    }
  }

  // Calculate distances from last draw numbers
  for (let i = 1; i <= 49; i++) {
    if (suggestions.has(i)) continue; // Skip numbers already added

    const coords = numberCoords.get(i);
    if (!coords) continue;

    let minDistance = Infinity;

    for (const lastNum of lastDrawNumbers) {
      const lastCoords = numberCoords.get(lastNum);
      if (!lastCoords) continue;

      // Calculate Manhattan distance in the grid
      const distance = Math.abs(coords.x - lastCoords.x) + Math.abs(coords.y - lastCoords.y);
      minDistance = Math.min(minDistance, distance);
    }

    if (minDistance < Infinity) {
      closeNumbers.set(i, {
        distance: minDistance,
        frequency: numberFrequencies.get(i) || 0
      });
    }
  }

  // Sort close numbers by distance only (closest first), frequency only used as tie-breaker
  const sortedCloseNumbers = Array.from(closeNumbers.entries())
    .sort((a, b) => {
      const [, dataA] = a;
      const [, dataB] = b;

      // First by distance (closest first) - frequency does NOT override distance
      if (dataA.distance !== dataB.distance) {
        return dataA.distance - dataB.distance;
      }

      // Only use frequency as tie-breaker when distances are exactly equal
      return dataB.frequency - dataA.frequency;
    });

  // Add close numbers to suggestions
  for (const [num, data] of sortedCloseNumbers) {
    if (!suggestions.has(num)) {
      suggestions.set(num, {
        number: num,
        reason: `Close to last draw numbers (distance: ${data.distance})`,
      });
    }
  }

  // Return all suggestions (last draw numbers first, then close numbers by distance)
  return Array.from(suggestions.values());
}