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
 * Suggests lottery numbers based on the Gann Square method discussed in the U Lifestyle article.
 * The logic is as follows:
 * 1. Identify rows or columns containing two or more numbers from the last draw. These are "hot zones."
 * 2. Suggest ALL numbers within these "hot" rows and columns.
 * 3. If a number from the last draw is not in a "hot zone," suggest it as a potential repeater.
 *
 * @param historicalDraws An array of historical draw records, with the last element being the most recent.
 * @returns An array of suggested numbers with the reason for their suggestion.
 */
export function suggestNumbersByGannSquare(historicalDraws: DrawRecord[]): SuggestedNumber[] {
  if (!historicalDraws || historicalDraws.length === 0) {
    throw new Error('No historical data provided');
  }

  const gannSquare = generateGannSquare();
  const size = gannSquare.length;
  const recentDraw = historicalDraws[historicalDraws.length - 1];
  const lastDrawNumbers = new Set([...recentDraw.winningNumbers, recentDraw.specialNumber]);
  const suggestions = new Map<number, SuggestedNumber>();

  // Step 1: Count hits from the last draw in each row and column and map number coordinates.
  const rowCounts = Array(size).fill(0);
  const colCounts = Array(size).fill(0);
  const numberCoords = new Map<number, { y: number; x: number }>();

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const num = gannSquare[y][x];
      if (num) {
        if (lastDrawNumbers.has(num)) {
          rowCounts[y]++;
          colCounts[x]++;
          numberCoords.set(num, { y, x });
        }
      }
    }
  }

  // Step 2: Identify "hot zones" and add all numbers from them.
  for (let y = 0; y < size; y++) {
    if (rowCounts[y] >= 2) {
      // This is a "hot row"
      const numsInRow = Array.from(lastDrawNumbers).filter(n => numberCoords.get(n)?.y === y);
      for (let x = 0; x < size; x++) {
        const numInHotRow = gannSquare[y][x];
        if (numInHotRow && !suggestions.has(numInHotRow)) {
          suggestions.set(numInHotRow, {
            number: numInHotRow,
            reason: `In 'hot' row containing ${numsInRow.join(', ')}`,
          });
        }
      }
    }
  }

  for (let x = 0; x < size; x++) {
    if (colCounts[x] >= 2) {
      // This is a "hot column"
       const numsInCol = Array.from(lastDrawNumbers).filter(n => numberCoords.get(n)?.x === x);
      for (let y = 0; y < size; y++) {
        const numInHotCol = gannSquare[y][x];
        if (numInHotCol && !suggestions.has(numInHotCol)) {
          suggestions.set(numInHotCol, {
            number: numInHotCol,
            reason: `In 'hot' column containing ${numsInCol.join(', ')}`,
          });
        }
      }
    }
  }

  // Step 3: Identify and add "isolated" numbers from the last draw.
  for (const num of lastDrawNumbers) {
    const coords = numberCoords.get(num);
    if (coords) {
      const { y, x } = coords;
      // An isolated number is one where its row and column both have less than 2 hits.
      if (rowCounts[y] < 2 && colCounts[x] < 2) {
        if (!suggestions.has(num)) {
          suggestions.set(num, {
            number: num,
            reason: 'Isolated number from last draw (potential repeater)',
          });
        }
      }
    }
  }

  // Return a sorted array of the suggested numbers.
  return Array.from(suggestions.values()).sort((a, b) => a.number - b.number);
}