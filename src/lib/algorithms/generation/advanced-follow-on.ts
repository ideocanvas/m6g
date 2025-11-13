/**
 * Advanced Follow-on Algorithm
 *
 * Enhanced version with:
 * - Multi-step follow-on chains (not just immediate)
 * - Conditional probability based on multiple triggers
 * - Pattern clustering for similar draw conditions
 * - Weighted combination of different time horizons
 */

// Debug flag to control logging
const DEBUG = process.env.DEBUG === 'true' || false;

import { DrawRecord, FollowOnCombinationResult } from '../types';

interface NumberProbability {
  number: number;
  probability: number;
}


interface FollowOnChain {
  chain: number[];
  frequency: number;
  probability: number;
  timeHorizon: number;
}

interface PatternCluster {
  numbers: number[];
  frequency: number;
  similarity: number;
  conditions: {
    drawDay: number; // 0-6 (Sunday-Saturday)
    month: number;
    season: number; // 1-4
  };
}

interface ConditionalProbability {
  triggerNumbers: number[];
  targetNumbers: number[];
  probability: number;
  confidence: number;
}

export interface AdvancedFollowOnAnalysis {
  followOnChains: FollowOnChain[];
  conditionalProbs: ConditionalProbability[];
  patternClusters: PatternCluster[];
  weightedProbabilities: Map<number, number>;
}

/**
 * Advanced Follow-on Algorithm Implementation
 */
export function generateAdvancedFollowOnCombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  historicalDraws: DrawRecord[]
): FollowOnCombinationResult[] {
  const startTime = Date.now();

  // Validate that we have enough selected numbers
  const combinationSize = isDouble ? 7 : 6;
  if (selectedNumbers.length < combinationSize) {
    throw new Error(`Need at least ${combinationSize} selected numbers for ${isDouble ? 'double' : 'regular'} combinations`);
  }

  if (DEBUG) console.log(`[ADV_FOLLOW_ON] Generating ${combinationCount} combinations from ${selectedNumbers.length} selected numbers`);

  // Calculate time-weighted individual probabilities
  const individualProbs = calculateTimeWeightedProbabilities(selectedNumbers, historicalDraws);

  // Calculate pair probabilities
  const pairProbs = calculatePairProbabilities(selectedNumbers, historicalDraws);

  // Generate weighted combinations from selected numbers only
  const result = generateProbabilityBasedCombinations(
    combinationCount,
    selectedNumbers,
    luckyNumber,
    isDouble,
    individualProbs,
    pairProbs
  );

  const totalTime = Date.now() - startTime;
  if (DEBUG) console.log(`[ADV_FOLLOW_ON] Generated ${result.length} combinations in ${totalTime}ms`);

  // For double combinations, calculate split numbers based on least winning probability
  const finalResults = result.map((item) => {
    let splitNumbers: number[] = [];

    if (isDouble && item.combination.length === 7) {
      // Calculate which two numbers have the least chance to win
      splitNumbers = calculateSplitNumbers(item.combination, historicalDraws);
    }

    return {
      ...item,
      splitNumbers: splitNumbers.length > 0 ? splitNumbers : undefined
    };
  });

  return finalResults;
}

/**
 * Calculate time-weighted individual probabilities for selected numbers
 */
function calculateTimeWeightedProbabilities(
  selectedNumbers: number[],
  historicalDraws: DrawRecord[]
): Map<number, number> {
  const probabilities = new Map<number, number>();

  for (const num of selectedNumbers) {
    // Calculate probabilities for different time horizons
    const prob1 = calculateProbabilityWithinDraws(num, historicalDraws, 1);
    const prob2 = calculateProbabilityWithinDraws(num, historicalDraws, 2);
    const prob3 = calculateProbabilityWithinDraws(num, historicalDraws, 3);

    // Merge with weighted average (1-draw: 0.5, 2-draw: 0.3, 3-draw: 0.2)
    const finalProb = (prob1 * 0.5) + (prob2 * 0.3) + (prob3 * 0.2);
    probabilities.set(num, finalProb);
  }

  return probabilities;
}

/**
 * Calculate probability of a number appearing within N draws
 */
function calculateProbabilityWithinDraws(
  number: number,
  historicalDraws: DrawRecord[],
  drawsToCheck: number
): number {
  if (historicalDraws.length <= drawsToCheck) return 0;

  let appearances = 0;
  let totalChecks = 0;

  for (let i = drawsToCheck; i < historicalDraws.length; i++) {
    const checkDraws = historicalDraws.slice(i - drawsToCheck, i);
    const appearsInWindow = checkDraws.some(draw =>
      draw.winningNumbers.includes(number) || draw.specialNumber === number
    );

    if (appearsInWindow) {
      appearances++;
    }
    totalChecks++;
  }

  return totalChecks > 0 ? appearances / totalChecks : 0;
}

/**
 * Calculate pair probabilities for selected numbers
 */
function calculatePairProbabilities(
  selectedNumbers: number[],
  historicalDraws: DrawRecord[]
): Map<string, number> {
  const pairProbs = new Map<string, number>();

  // Generate all possible pairs from selected numbers
  for (let i = 0; i < selectedNumbers.length; i++) {
    for (let j = i + 1; j < selectedNumbers.length; j++) {
      const num1 = selectedNumbers[i];
      const num2 = selectedNumbers[j];
      const pairKey = `${Math.min(num1, num2)},${Math.max(num1, num2)}`;

      let coOccurrences = 0;
      let totalDraws = 0;

      for (const draw of historicalDraws) {
        const drawNumbers = [...draw.winningNumbers, draw.specialNumber];
        const hasNum1 = drawNumbers.includes(num1);
        const hasNum2 = drawNumbers.includes(num2);

        if (hasNum1 && hasNum2) {
          coOccurrences++;
        }
        totalDraws++;
      }

      const probability = totalDraws > 0 ? coOccurrences / totalDraws : 0;
      pairProbs.set(pairKey, probability);
    }
  }

  return pairProbs;
}

/**
 * Generate probability-based combinations from selected numbers only
 */
function generateProbabilityBasedCombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  individualProbs: Map<number, number>,
  pairProbs: Map<string, number>
): FollowOnCombinationResult[] {
  const combinations: FollowOnCombinationResult[] = [];
  const usedCombinations = new Set<string>();
  const combinationSize = isDouble ? 7 : 6;

  // Convert individual probabilities to weighted array
  const weightedNumbers: Array<{ number: number; weight: number }> = [];
  for (const [num, prob] of individualProbs) {
    weightedNumbers.push({ number: num, weight: prob });
  }

  // Sort by probability (descending)
  weightedNumbers.sort((a, b) => b.weight - a.weight);

  while (combinations.length < combinationCount && weightedNumbers.length >= combinationSize) {
    const combination = selectWeightedCombinationFromSelected(
      weightedNumbers,
      combinationSize,
      pairProbs
    );

    const combinationKey = combination.sort((a, b) => a - b).join(',');

    if (!usedCombinations.has(combinationKey)) {
      usedCombinations.add(combinationKey);
      combinations.push({
        combination,
        sequenceNumber: combinations.length + 1,
        weights: individualProbs
      });
    }
  }

  return combinations;
}

/**
 * Select weighted combination from selected numbers considering pair probabilities
 */
function selectWeightedCombinationFromSelected(
  weightedNumbers: Array<{ number: number; weight: number }>,
  combinationSize: number,
  pairProbs: Map<string, number>
): number[] {
  const combination: number[] = [];
  const availableNumbers = [...weightedNumbers];

  // Select numbers using weighted random selection with pair consideration
  while (combination.length < combinationSize && availableNumbers.length > 0) {
    const totalWeight = availableNumbers.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < availableNumbers.length; i++) {
      random -= availableNumbers[i].weight;
      if (random <= 0) {
        const selectedNum = availableNumbers[i].number;

        // Apply pair probability boost if this number pairs well with existing combination
        let pairBoost = 1.0;
        if (combination.length > 0) {
          const pairScores = combination.map(existingNum => {
            const pairKey = `${Math.min(existingNum, selectedNum)},${Math.max(existingNum, selectedNum)}`;
            return pairProbs.get(pairKey) || 0;
          });
          pairBoost = 1.0 + (Math.max(...pairScores) * 0.5); // Boost up to 50% for good pairs
        }

        // Apply the selection with pair boost
        if (Math.random() < pairBoost) {
          combination.push(selectedNum);
          availableNumbers.splice(i, 1);
        }
        break;
      }
    }
  }

  return combination.sort((a, b) => a - b);
}










/**
 * Calculate which two numbers in a 7-number combination should be split for partial bets
 * Selects numbers with the least probability of winning based on historical data
 */
function calculateSplitNumbers(combination: number[], historicalDraws: DrawRecord[]): number[] {
  // Calculate winning probability for each number in the combination
  const probabilities: NumberProbability[] = combination.map(number => ({
    number,
    probability: calculateWinningProbability(number, historicalDraws)
  }));

  // Sort by probability ascending (least likely to win first)
  probabilities.sort((a, b) => a.probability - b.probability);

  // Return the two numbers with the lowest winning probability
  return probabilities.slice(0, 2).map(p => p.number);
}

/**
 * Calculate winning probability for a single number based on historical data
 */
function calculateWinningProbability(number: number, historicalDraws: DrawRecord[]): number {
  if (historicalDraws.length === 0) return 0;

  let appearances = 0;
  let totalDraws = 0;

  for (const draw of historicalDraws) {
    // Count if number appears in winning numbers or special number
    if (draw.winningNumbers.includes(number) || draw.specialNumber === number) {
      appearances++;
    }
    totalDraws++;
  }

  return appearances / totalDraws;
}