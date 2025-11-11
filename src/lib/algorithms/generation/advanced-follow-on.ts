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

interface AdvancedFollowOnConfig {
  maxChainLength: number;
  timeHorizons: number[]; // Number of draws to look back
  patternThreshold: number;
  conditionalProbabilityThreshold: number;
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
  historicalDraws: DrawRecord[],
  preCalculatedAnalysis?: AdvancedFollowOnAnalysis
): FollowOnCombinationResult[] {
  const startTime = Date.now();

  // Use pre-calculated analysis or calculate new
  let analysis: AdvancedFollowOnAnalysis;

  if (preCalculatedAnalysis) {
    if (DEBUG) console.log(`[ADV_FOLLOW_ON] Using pre-calculated analysis`);
    analysis = preCalculatedAnalysis;
  } else {
    // Performance optimization: Use adaptive configuration based on data size
    const config: AdvancedFollowOnConfig = {
      maxChainLength: Math.min(3, Math.floor(historicalDraws.length / 100) + 1),
      timeHorizons: historicalDraws.length > 100 ? [1, 3, 5, 10] : [1, 3], // Reduce horizons for small datasets
      patternThreshold: 0.7,
      conditionalProbabilityThreshold: 0.6
    };

    if (DEBUG) console.log(`[ADV_FOLLOW_ON] Starting analysis with ${historicalDraws.length} historical draws, config:`, config);

    // Performance optimization: Limit analysis to recent draws for large datasets
    const analysisDraws = historicalDraws.length > 200
      ? historicalDraws.slice(-200)
      : historicalDraws;

    // Analyze multi-step follow-on chains
    const followOnChains = analyzeMultiStepChains(analysisDraws, config);

    // Calculate conditional probabilities
    const conditionalProbs = calculateConditionalProbabilities(analysisDraws, config);

    // Cluster patterns by similar conditions
    const patternClusters = clusterPatterns(analysisDraws, config);

    // Generate weighted probabilities across time horizons
    const weightedProbabilities = calculateWeightedProbabilities(
      analysisDraws,
      followOnChains,
      conditionalProbs,
      patternClusters
    );

    analysis = {
      followOnChains,
      conditionalProbs,
      patternClusters,
      weightedProbabilities
    };
  }

  // Generate combinations based on advanced analysis
  const result = generateCombinationsFromAnalysis(
    combinationCount,
    selectedNumbers,
    luckyNumber,
    isDouble,
    analysis.weightedProbabilities
  );

  const totalTime = Date.now() - startTime;
  if (DEBUG) console.log(`[ADV_FOLLOW_ON] Generated ${result.length} combinations in ${totalTime}ms`);

  return result;
}

/**
 * Analyze multi-step follow-on chains
 */
function analyzeMultiStepChains(
  historicalDraws: DrawRecord[],
  config: AdvancedFollowOnConfig
): FollowOnChain[] {
  const chains: FollowOnChain[] = [];

  // Analyze chains for each time horizon
  for (const horizon of config.timeHorizons) {
    for (let i = horizon; i < historicalDraws.length; i++) {
      const currentDraw = historicalDraws[i];
      const previousDraws = historicalDraws.slice(i - horizon, i);

      // Analyze chains of different lengths
      for (let chainLength = 1; chainLength <= config.maxChainLength; chainLength++) {
        const chain = analyzeChain(previousDraws, currentDraw, chainLength, horizon);
        if (chain) {
          chains.push(chain);
        }
      }
    }
  }

  return chains;
}

/**
 * Analyze a specific chain pattern
 */
function analyzeChain(
  previousDraws: DrawRecord[],
  currentDraw: DrawRecord,
  chainLength: number,
  timeHorizon: number
): FollowOnChain | null {
  if (previousDraws.length < chainLength) return null;

  const chainNumbers: number[] = [];

  // Build the chain from previous draws
  for (let i = 0; i < chainLength; i++) {
    const draw = previousDraws[previousDraws.length - 1 - i];
    chainNumbers.push(...draw.winningNumbers, draw.specialNumber);
  }

  // Check if current draw contains numbers from the chain
  const currentNumbers = [...currentDraw.winningNumbers, currentDraw.specialNumber];
  const matchingNumbers = currentNumbers.filter(num => chainNumbers.includes(num));

  if (matchingNumbers.length > 0) {
    return {
      chain: chainNumbers.slice(0, 7), // Limit to reasonable size
      frequency: matchingNumbers.length,
      probability: matchingNumbers.length / currentNumbers.length,
      timeHorizon
    };
  }

  return null;
}

/**
 * Calculate conditional probabilities based on multiple triggers
 */
function calculateConditionalProbabilities(
  historicalDraws: DrawRecord[],
  config: AdvancedFollowOnConfig
): ConditionalProbability[] {
  const conditionalProbs: ConditionalProbability[] = [];
  const maxDrawsToAnalyze = Math.min(100, historicalDraws.length);

  // Performance optimization: Use recent draws only and limit analysis
  for (let i = Math.max(1, historicalDraws.length - maxDrawsToAnalyze); i < historicalDraws.length; i++) {
    const previousDraw = historicalDraws[i - 1];
    const currentDraw = historicalDraws[i];

    const previousNumbers = [...previousDraw.winningNumbers, previousDraw.specialNumber];
    const currentNumbers = [...currentDraw.winningNumbers, currentDraw.specialNumber];

    // Performance optimization: Limit trigger size and use sampling for large datasets
    const maxTriggerSize = historicalDraws.length > 50 ? 2 : 3;

    for (let triggerSize = 1; triggerSize <= maxTriggerSize; triggerSize++) {
      // Performance optimization: Use limited number of trigger combinations
      const triggers = getNumberCombinationsOptimized(previousNumbers, triggerSize, 20);

      for (const trigger of triggers) {
        const matchingNumbers = currentNumbers.filter(num =>
          !trigger.includes(num) // Exclude trigger numbers from targets
        );

        if (matchingNumbers.length > 0) {
          const probability = matchingNumbers.length / (7 - triggerSize);
          const confidence = calculateConfidence(trigger, historicalDraws);

          if (probability >= config.conditionalProbabilityThreshold) {
            conditionalProbs.push({
              triggerNumbers: trigger,
              targetNumbers: matchingNumbers,
              probability,
              confidence
            });
          }
        }
      }
    }
  }

  return conditionalProbs;
}

/**
 * Cluster patterns by similar draw conditions
 */
function clusterPatterns(
  historicalDraws: DrawRecord[],
  config: AdvancedFollowOnConfig
): PatternCluster[] {
  const clusters: PatternCluster[] = [];

  for (const draw of historicalDraws) {
    if (!draw.drawDate) continue;

    // Handle both Date objects and string dates
    const drawDate = typeof draw.drawDate === 'string' ? new Date(draw.drawDate) : draw.drawDate;

    const conditions = {
      drawDay: drawDate.getDay(),
      month: drawDate.getMonth(),
      season: Math.floor(drawDate.getMonth() / 3) + 1
    };

    const numbers = [...draw.winningNumbers, draw.specialNumber];

    // Find similar cluster or create new one
    let bestCluster: PatternCluster | null = null;
    let bestSimilarity = 0;

    for (const cluster of clusters) {
      const similarity = calculatePatternSimilarity(numbers, cluster.numbers, conditions, cluster.conditions);
      if (similarity > bestSimilarity && similarity >= config.patternThreshold) {
        bestCluster = cluster;
        bestSimilarity = similarity;
      }
    }

    if (bestCluster) {
      // Update existing cluster
      bestCluster.frequency++;
      bestCluster.similarity = (bestCluster.similarity + bestSimilarity) / 2;
    } else {
      // Create new cluster
      clusters.push({
        numbers,
        frequency: 1,
        similarity: 1.0,
        conditions
      });
    }
  }

  return clusters.filter(cluster => cluster.frequency > 1); // Only keep clusters with multiple occurrences
}

/**
 * Calculate weighted probabilities across different time horizons
 */
function calculateWeightedProbabilities(
  historicalDraws: DrawRecord[],
  followOnChains: FollowOnChain[],
  conditionalProbs: ConditionalProbability[],
  patternClusters: PatternCluster[]
): Map<number, number> {
  const probabilities = new Map<number, number>();

  // Initialize all numbers with base probability
  for (let i = 1; i <= 49; i++) {
    probabilities.set(i, 0.01); // Base probability
  }

  // Apply follow-on chain probabilities
  for (const chain of followOnChains) {
    const weight = chain.probability * (1 / chain.timeHorizon);
    for (const num of chain.chain) {
      const currentProb = probabilities.get(num) || 0;
      probabilities.set(num, currentProb + weight);
    }
  }

  // Apply conditional probabilities
  for (const cp of conditionalProbs) {
    const weight = cp.probability * cp.confidence;
    for (const num of cp.targetNumbers) {
      const currentProb = probabilities.get(num) || 0;
      probabilities.set(num, currentProb + weight);
    }
  }

  // Apply pattern cluster probabilities
  for (const cluster of patternClusters) {
    const weight = cluster.frequency * cluster.similarity / historicalDraws.length;
    for (const num of cluster.numbers) {
      const currentProb = probabilities.get(num) || 0;
      probabilities.set(num, currentProb + weight);
    }
  }

  // Normalize probabilities
  const total = Array.from(probabilities.values()).reduce((sum, prob) => sum + prob, 0);
  for (const [num, prob] of probabilities) {
    probabilities.set(num, prob / total);
  }

  return probabilities;
}

/**
 * Generate combinations from advanced analysis
 */
function generateCombinationsFromAnalysis(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  weightedProbabilities: Map<number, number>
): FollowOnCombinationResult[] {
  const combinations: FollowOnCombinationResult[] = [];
  const usedCombinations = new Set<string>();

  // Convert probabilities to weighted array for selection
  const weightedNumbers: Array<{ number: number; weight: number }> = [];
  for (const [num, prob] of weightedProbabilities) {
    weightedNumbers.push({ number: num, weight: prob });
  }

  // Sort by probability (descending)
  weightedNumbers.sort((a, b) => b.weight - a.weight);

  // Generate combinations - require at least 6 numbers for regular, 7 for double
  const requiredNumbers = isDouble ? 7 : 6;
  while (combinations.length < combinationCount && weightedNumbers.length >= requiredNumbers) {
    const combination = selectWeightedCombination(weightedNumbers, luckyNumber, isDouble);
    const combinationKey = combination.sort((a, b) => a - b).join(',');

    if (!usedCombinations.has(combinationKey)) {
      usedCombinations.add(combinationKey);
      combinations.push({
        combination,
        sequenceNumber: combinations.length + 1,
        weights: weightedProbabilities
      });
    }
  }

  return combinations;
}

/**
 * Select weighted combination based on probabilities
 */
function selectWeightedCombination(
  weightedNumbers: Array<{ number: number; weight: number }>,
  luckyNumber: number,
  isDouble: boolean
): number[] {
  const combination: number[] = [];
  const availableNumbers = [...weightedNumbers];

  // Select 6 main numbers using weighted random selection
  while (combination.length < 6 && availableNumbers.length > 0) {
    const totalWeight = availableNumbers.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < availableNumbers.length; i++) {
      random -= availableNumbers[i].weight;
      if (random <= 0) {
        combination.push(availableNumbers[i].number);
        availableNumbers.splice(i, 1);
        break;
      }
    }
  }

  // For double combinations, ensure we have 7 numbers total
  if (isDouble) {
    // If lucky number is not already included, add it
    if (!combination.includes(luckyNumber)) {
      combination.push(luckyNumber);
    }
    
    // If we still don't have 7 numbers, add another number
    if (combination.length < 7 && availableNumbers.length > 0) {
      const totalWeight = availableNumbers.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;

      for (let i = 0; i < availableNumbers.length; i++) {
        random -= availableNumbers[i].weight;
        if (random <= 0) {
          combination.push(availableNumbers[i].number);
          break;
        }
      }
    }
  }

  return combination.sort((a, b) => a - b);
}


/**
 * Helper function to get number combinations with performance optimization
 */
function getNumberCombinationsOptimized(numbers: number[], size: number, maxResults: number = 50): number[][] {
  const result: number[][] = [];
  const numbersToUse = numbers.slice(0, Math.min(10, numbers.length)); // Limit input size

  function backtrack(start: number, current: number[]) {
    if (current.length === size) {
      result.push([...current]);
      return result.length >= maxResults; // Early termination
    }

    for (let i = start; i < numbersToUse.length; i++) {
      current.push(numbersToUse[i]);
      const shouldStop = backtrack(i + 1, current);
      current.pop();
      if (shouldStop) return true;
    }
    return false;
  }

  backtrack(0, []);
  return result;
}


/**
 * Calculate confidence for conditional probability
 */
function calculateConfidence(trigger: number[], historicalDraws: DrawRecord[]): number {
  let occurrences = 0;
  let totalOccurrences = 0;

  for (let i = 1; i < historicalDraws.length; i++) {
    const previousNumbers = [...historicalDraws[i - 1].winningNumbers, historicalDraws[i - 1].specialNumber];

    // Check if trigger appears in previous draw
    const triggerPresent = trigger.every(num => previousNumbers.includes(num));

    if (triggerPresent) {
      totalOccurrences++;
      const currentNumbers = [...historicalDraws[i].winningNumbers, historicalDraws[i].specialNumber];
      const hasFollowOn = trigger.some(num => currentNumbers.includes(num));

      if (hasFollowOn) {
        occurrences++;
      }
    }
  }

  return totalOccurrences > 0 ? occurrences / totalOccurrences : 0;
}

/**
 * Calculate pattern similarity
 */
function calculatePatternSimilarity(
  numbers1: number[],
  numbers2: number[],
  conditions1: { drawDay: number; month: number; season: number },
  conditions2: { drawDay: number; month: number; season: number }
): number {
  // Number similarity (Jaccard index)
  const intersection = numbers1.filter(num => numbers2.includes(num)).length;
  const union = new Set([...numbers1, ...numbers2]).size;
  const numberSimilarity = intersection / union;

  // Condition similarity
  let conditionSimilarity = 0;
  if (conditions1.drawDay === conditions2.drawDay) conditionSimilarity += 0.3;
  if (conditions1.month === conditions2.month) conditionSimilarity += 0.3;
  if (conditions1.season === conditions2.season) conditionSimilarity += 0.4;

  // Combined similarity
  return (numberSimilarity * 0.6) + (conditionSimilarity * 0.4);
}

/**
 * Pre-calculate advanced follow-on analysis for reuse
 */
export function calculateAdvancedFollowOnAnalysis(
  historicalDraws: DrawRecord[]
): AdvancedFollowOnAnalysis {
  const config: AdvancedFollowOnConfig = {
    maxChainLength: Math.min(3, Math.floor(historicalDraws.length / 100) + 1),
    timeHorizons: historicalDraws.length > 100 ? [1, 3, 5, 10] : [1, 3],
    patternThreshold: 0.7,
    conditionalProbabilityThreshold: 0.6
  };

  // Performance optimization: Limit analysis to recent draws for large datasets
  const analysisDraws = historicalDraws.length > 200
    ? historicalDraws.slice(-200)
    : historicalDraws;

  // Analyze multi-step follow-on chains
  const followOnChains = analyzeMultiStepChains(analysisDraws, config);

  // Calculate conditional probabilities
  const conditionalProbs = calculateConditionalProbabilities(analysisDraws, config);

  // Cluster patterns by similar conditions
  const patternClusters = clusterPatterns(analysisDraws, config);

  // Generate weighted probabilities across time horizons
  const weightedProbabilities = calculateWeightedProbabilities(
    analysisDraws,
    followOnChains,
    conditionalProbs,
    patternClusters
  );

  return {
    followOnChains,
    conditionalProbs,
    patternClusters,
    weightedProbabilities
  };
}