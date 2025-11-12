/**
 * Advanced Follow-on Analysis
 *
 * Enhanced version with:
 * - Multi-step follow-on chains (not just immediate)
 * - Conditional probability based on multiple triggers
 * - Pattern clustering for similar draw conditions
 * - Weighted combination of different time horizons
 * - Analysis across multiple recent draws, not just the last one
 */

// Debug flag to control logging
const DEBUG = process.env.DEBUG === 'true' || false;

import { DrawRecord, FollowOnResult } from '../types';

interface AdvancedFollowOnConfig {
  maxChainLength: number;
  timeHorizons: number[]; // Number of draws to look back
  patternThreshold: number;
  conditionalProbabilityThreshold: number;
  recentDrawsToAnalyze: number; // Number of recent draws to analyze (not just last one)
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

/**
 * Advanced Follow-on Analysis Implementation
 * Analyzes multiple recent draws and incorporates advanced patterns
 */
export function getAdvancedFollowOnNumbers(
  historicalDraws: DrawRecord[],
  config?: Partial<AdvancedFollowOnConfig>
): FollowOnResult[] {
  const startTime = Date.now();

  if (!historicalDraws || historicalDraws.length === 0) {
    throw new Error('No historical data provided');
  }

  // Use provided config or default values
  const finalConfig: AdvancedFollowOnConfig = {
    maxChainLength: Math.min(3, Math.floor(historicalDraws.length / 100) + 1),
    timeHorizons: historicalDraws.length > 100 ? [1, 3, 5, 10] : [1, 3],
    patternThreshold: 0.7,
    conditionalProbabilityThreshold: 0.6,
    recentDrawsToAnalyze: Math.min(5, Math.floor(historicalDraws.length / 20)), // Adaptive based on data size
    ...config
  };

  if (DEBUG) console.log(`[ADV_FOLLOW_ON_ANALYSIS] Starting analysis with ${historicalDraws.length} historical draws, config:`, finalConfig);

  // Performance optimization: Limit analysis to recent draws for large datasets
  const analysisDraws = historicalDraws.length > 200
    ? historicalDraws.slice(-200)
    : historicalDraws;

  // Get multiple recent draws for analysis (not just the last one)
  const recentDraws = analysisDraws.slice(-finalConfig.recentDrawsToAnalyze);

  if (recentDraws.length === 0) {
    throw new Error('No recent draws found');
  }

  if (DEBUG) console.log(`[ADV_FOLLOW_ON_ANALYSIS] Analyzing ${recentDraws.length} recent draws`);

  // Analyze multi-step follow-on chains
  const followOnChains = analyzeMultiStepChains(analysisDraws, finalConfig);

  // Calculate conditional probabilities
  const conditionalProbs = calculateConditionalProbabilities(analysisDraws, finalConfig);

  // Cluster patterns by similar conditions
  const patternClusters = clusterPatterns(analysisDraws, finalConfig);

  // Generate weighted probabilities across time horizons
  const weightedProbabilities = calculateWeightedProbabilities(
    analysisDraws,
    followOnChains,
    conditionalProbs,
    patternClusters
  );

  // Calculate final numbers based on recent draws and advanced analysis
  const finalNumbers = calculateFinalNumbers(
    recentDraws,
    weightedProbabilities,
    analysisDraws
  );

  const totalTime = Date.now() - startTime;
  if (DEBUG) console.log(`[ADV_FOLLOW_ON_ANALYSIS] Generated ${finalNumbers.length} numbers in ${totalTime}ms`);

  return finalNumbers;
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
 * Calculate final numbers based on recent draws and advanced analysis
 */
function calculateFinalNumbers(
  recentDraws: DrawRecord[],
  weightedProbabilities: Map<number, number>,
  historicalDraws: DrawRecord[],
): FollowOnResult[] {
  const finalWeights = new Map<number, number>();

  // Initialize with base weighted probabilities
  for (let i = 1; i <= 49; i++) {
    finalWeights.set(i, weightedProbabilities.get(i) || 0);
  }

  // Apply recent draw analysis - analyze multiple recent draws, not just the last one
  for (const recentDraw of recentDraws) {
    const recentNumbers = [...recentDraw.winningNumbers, recentDraw.specialNumber];

    // Calculate follow-on patterns for this specific recent draw
    const recentFollowOnMap = calculateRecentFollowOnMap(recentNumbers, historicalDraws);

    // Apply weights from recent draw analysis
    for (const [num, weight] of recentFollowOnMap) {
      const currentWeight = finalWeights.get(num) || 0;
      finalWeights.set(num, currentWeight + weight);
    }
  }

  // Convert to array and sort by weight (descending)
  const finalNumbers = Array.from(finalWeights.entries())
    .map(([number, weight]) => ({ number, weight }))
    .sort((a, b) => b.weight - a.weight);

  return finalNumbers;
}

/**
 * Calculate follow-on map for a specific recent draw
 */
function calculateRecentFollowOnMap(
  recentNumbers: number[],
  historicalDraws: DrawRecord[]
): Map<number, number> {
  const followOnMap = new Map<number, Map<number, number>>();

  // Build follow-on patterns from historical data
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

  // Calculate weighted pool based on recent numbers
  const weightedPool = new Map<number, number>();

  for (const num of recentNumbers) {
    if (followOnMap.has(num)) {
      const followers = followOnMap.get(num)!;
      followers.forEach((count, followerNum) => {
        weightedPool.set(followerNum, (weightedPool.get(followerNum) || 0) + count);
      });
    }
  }

  return weightedPool;
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
      const hasTarget = trigger.some(num => currentNumbers.includes(num));
      if (hasTarget) {
        occurrences++;
      }
    }
  }

  return totalOccurrences > 0 ? occurrences / totalOccurrences : 0;
}

/**
 * Calculate pattern similarity between two sets of numbers and conditions
 */
function calculatePatternSimilarity(
  numbers1: number[],
  numbers2: number[],
  conditions1: { drawDay: number; month: number; season: number },
  conditions2: { drawDay: number; month: number; season: number }
): number {
  // Calculate number similarity (Jaccard index)
  const intersection = numbers1.filter(num => numbers2.includes(num)).length;
  const union = new Set([...numbers1, ...numbers2]).size;
  const numberSimilarity = union > 0 ? intersection / union : 0;

  // Calculate condition similarity
  const conditionSimilarity = (
    (conditions1.drawDay === conditions2.drawDay ? 0.4 : 0) +
    (conditions1.month === conditions2.month ? 0.3 : 0) +
    (conditions1.season === conditions2.season ? 0.3 : 0)
  );

  // Weighted combination
  return (numberSimilarity * 0.7) + (conditionSimilarity * 0.3);
}