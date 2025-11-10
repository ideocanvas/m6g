import { DrawRecord, FollowOnCombinationResult } from './types';

/**
 * Follow-on generation algorithm based on statistical relationships between consecutive draws
 * Pure function that only depends on input parameters (IoC pattern)
 * Corresponds to the original V2 generation logic
 */
export function generateFollowOnCombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  historicalDraws: DrawRecord[],
  lastDrawNumbers: number[]
): FollowOnCombinationResult[] {
  if (!historicalDraws || historicalDraws.length === 0) {
    throw new Error('No historical data provided');
  }

  if (!lastDrawNumbers || lastDrawNumbers.length === 0) {
    throw new Error('No last draw numbers provided');
  }

  const followOnPatterns = analyzeFollowOnPatterns(historicalDraws);

  // Create weighted pool based on follow-on patterns
  const weightedPool = new Map<number, number>();
  for (const num of lastDrawNumbers) {
    if (followOnPatterns.has(num)) {
      const followers = followOnPatterns.get(num)!;
      followers.forEach((count, followerNum) => {
        weightedPool.set(followerNum, (weightedPool.get(followerNum) || 0) + count);
      });
    }
  }

  // Create selection array with weighted probabilities
  const selectionArray: number[] = [];
  weightedPool.forEach((weight, num) => {
    for (let i = 0; i < weight; i++) {
      selectionArray.push(num);
    }
  });

  // Ensure we have at least all numbers 1-49 in the pool (as per reference)
  if (selectionArray.length < 49) {
    for (let i = 1; i <= 49; i++) {
      if (!weightedPool.has(i)) {
        selectionArray.push(i);
      }
    }
  }

  const generatedCombinations: number[][] = [];
  const combinationLength = isDouble ? 7 : 6;

  for (let i = 0; i < combinationCount; i++) {
    const combination = new Set<number>();

    // Always include lucky number
    combination.add(luckyNumber);

    // Include selected numbers if provided
    const userSelectionPool = selectedNumbers.filter(n => n !== luckyNumber);
    userSelectionPool.sort(() => 0.5 - Math.random());

    let userPickIndex = 0;
    while (combination.size < combinationLength && userPickIndex < userSelectionPool.length) {
      const selectedNum = userSelectionPool[userPickIndex];
      combination.add(selectedNum);
      userPickIndex++;
    }

    // Fill remaining numbers from weighted pool
    let attempts = 0;
    while (combination.size < combinationLength && attempts < 500) {
      if (selectionArray.length > 0) {
        const randomIndex = Math.floor(Math.random() * selectionArray.length);
        const pickedNumber = selectionArray[randomIndex];
        if (!combination.has(pickedNumber)) {
          combination.add(pickedNumber);
        }
      } else {
        const randomNum = Math.floor(Math.random() * 49) + 1;
        if (!combination.has(randomNum)) {
          combination.add(randomNum);
        }
      }
      attempts++;
    }

    const finalCombination = Array.from(combination);
    finalCombination.sort((a, b) => a - b);

    if (finalCombination.length === combinationLength) {
      generatedCombinations.push(finalCombination);
    }
  }

  return generatedCombinations.map((combination, index) => ({
    combination,
    sequenceNumber: index + 1,
    weights: weightedPool
  }));
}

/**
 * Analyze follow-on patterns from historical data
 */
function analyzeFollowOnPatterns(historicalDraws: DrawRecord[]): Map<number, Map<number, number>> {
  const followOnMap = new Map<number, Map<number, number>>();

  for (let i = 0; i < historicalDraws.length - 1; i++) {
    const currentDraw = historicalDraws[i];
    const nextDraw = historicalDraws[i + 1];

    const currentNumbers = [...currentDraw.winningNumbers, currentDraw.specialNumber];
    const nextNumbers = [...nextDraw.winningNumbers, nextDraw.specialNumber];

    for (const currentNum of currentNumbers) {
      if (!followOnMap.has(currentNum)) {
        followOnMap.set(currentNum, new Map());
      }
      const currentNumFollowers = followOnMap.get(currentNum)!;

      for (const nextNum of nextNumbers) {
        currentNumFollowers.set(nextNum, (currentNumFollowers.get(nextNum) || 0) + 1);
      }
    }
  }

  return followOnMap;
}