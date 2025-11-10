import { DrawRecord, FollowOnResult } from './types';

/**
 * Get follow-on numbers based on historical patterns
 * Pure function that only depends on input parameters (IoC pattern)
 */
export function getFollowOnNumbers(historicalDraws: DrawRecord[]): FollowOnResult[] {
  if (!historicalDraws || historicalDraws.length === 0) {
    throw new Error('No historical data provided');
  }

  // Get the most recent draw
  const recentDraws = historicalDraws.length > 0 ? [historicalDraws[historicalDraws.length - 1]] : [];

  if (recentDraws.length === 0) {
    throw new Error('No recent draw found');
  }

  const lastDrawNumbers = [
    ...recentDraws[0].winningNumbers,
    recentDraws[0].specialNumber
  ];

  // Analyze follow-on patterns
  const followOnMap = new Map<number, Map<number, number>>();

  for (let i = 0; i < historicalDraws.length - 1; i++) {
    const currentDraw = historicalDraws[i];
    const nextDraw = historicalDraws[i + 1];

    const currentNumbers = [
      ...currentDraw.winningNumbers,
      currentDraw.specialNumber
    ];

    const nextNumbers = [
      ...nextDraw.winningNumbers,
      nextDraw.specialNumber
    ];

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

  // Calculate weighted pool based on last draw numbers
  const weightedPool = new Map<number, number>();

  for (const num of lastDrawNumbers) {
    if (followOnMap.has(num)) {
      const followers = followOnMap.get(num)!;
      followers.forEach((count, followerNum) => {
        weightedPool.set(followerNum, (weightedPool.get(followerNum) || 0) + count);
      });
    }
  }

  // Convert to array and sort by weight (descending)
  const followOnNumbers = Array.from(weightedPool.entries())
    .map(([number, weight]) => ({ number, weight }))
    .sort((a, b) => b.weight - a.weight);

  return followOnNumbers;
}