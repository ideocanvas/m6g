import { DrawRecord } from '../types';

/**
 * Bayesian Probability model for Mark Six number generation
 * Uses Bayesian updating to calculate probabilities based on multiple evidence sources
 * Pure function that only depends on input parameters (IoC pattern)
 */
export function generateBayesianCombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  historicalDraws: DrawRecord[],
  lastDrawNumbers?: number[]
): { combination: number[]; probability: number }[] {
  if (!historicalDraws || historicalDraws.length === 0) {
    throw new Error('No historical data provided');
  }

  // Calculate Bayesian probabilities for all numbers
  const probabilities = calculateBayesianProbabilities(historicalDraws, lastDrawNumbers);

  const combinations: { combination: number[]; probability: number }[] = [];
  const combinationLength = isDouble ? 7 : 6;

  for (let i = 0; i < combinationCount; i++) {
    const combination = new Set<number>();
    let combinationProbability = 1;

    // Always include lucky number
    combination.add(luckyNumber);
    combinationProbability *= probabilities.get(luckyNumber) || 0.01;

    // Include selected numbers if provided
    const userSelectionPool = selectedNumbers.filter(n => n !== luckyNumber);
    userSelectionPool.sort(() => 0.5 - Math.random());

    let userPickIndex = 0;
    while (combination.size < combinationLength && userPickIndex < userSelectionPool.length) {
      const selectedNum = userSelectionPool[userPickIndex];
      combination.add(selectedNum);
      combinationProbability *= probabilities.get(selectedNum) || 0.01;
      userPickIndex++;
    }

    // Fill remaining numbers using Bayesian probabilities
    const probabilityPool = createProbabilityPool(probabilities);
    let attempts = 0;

    while (combination.size < combinationLength && attempts < 500) {
      if (probabilityPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * probabilityPool.length);
        const pickedNumber = probabilityPool[randomIndex];

        if (!combination.has(pickedNumber)) {
          combination.add(pickedNumber);
          combinationProbability *= probabilities.get(pickedNumber) || 0.01;
        }
      } else {
        // Fallback to random selection
        const randomNum = Math.floor(Math.random() * 49) + 1;
        if (!combination.has(randomNum)) {
          combination.add(randomNum);
          combinationProbability *= 0.01; // Low probability for random numbers
        }
      }
      attempts++;
    }

    const finalCombination = Array.from(combination);
    finalCombination.sort((a, b) => a - b);

    if (finalCombination.length === combinationLength) {
      combinations.push({
        combination: finalCombination,
        probability: combinationProbability
      });
    }
  }

  // Sort by probability descending
  return combinations.sort((a, b) => b.probability - a.probability);
}

/**
 * Calculate Bayesian probabilities for all numbers 1-49
 */
function calculateBayesianProbabilities(
  historicalDraws: DrawRecord[],
  lastDrawNumbers?: number[]
): Map<number, number> {
  const probabilities = new Map<number, number>();

  // Initialize with uniform prior (all numbers equally likely)
  const uniformPrior = 1 / 49;
  for (let i = 1; i <= 49; i++) {
    probabilities.set(i, uniformPrior);
  }

  // Update with frequency evidence (likelihood)
  updateWithFrequencyEvidence(probabilities, historicalDraws);

  // Update with follow-on evidence if last draw is available
  if (lastDrawNumbers && lastDrawNumbers.length > 0) {
    updateWithFollowOnEvidence(probabilities, historicalDraws, lastDrawNumbers);
  }

  // Update with temporal evidence (recent trends)
  updateWithTemporalEvidence(probabilities, historicalDraws);

  // Update with gap analysis evidence
  updateWithGapAnalysisEvidence(probabilities, historicalDraws);

  // Normalize probabilities to sum to 1
  normalizeProbabilities(probabilities);

  return probabilities;
}

/**
 * Update probabilities with frequency evidence
 */
function updateWithFrequencyEvidence(
  probabilities: Map<number, number>,
  historicalDraws: DrawRecord[]
): void {
  const frequencyMap = new Map<number, number>();

  // Count frequency of each number
  for (const draw of historicalDraws) {
    for (const num of draw.winningNumbers) {
      frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
    }
    frequencyMap.set(draw.specialNumber, (frequencyMap.get(draw.specialNumber) || 0) + 1);
  }

  // Calculate maximum frequency for normalization
  const maxFrequency = Math.max(...Array.from(frequencyMap.values()));

  // Update probabilities using frequency likelihood
  const frequencyWeight = 0.4; // How much we trust frequency evidence
  probabilities.forEach((currentProb, number) => {
    const frequency = frequencyMap.get(number) || 0;
    const frequencyLikelihood = frequency / maxFrequency;

    // Bayesian update: P(number|frequency) ∝ P(frequency|number) * P(number)
    const updatedProb = currentProb * (1 + frequencyWeight * frequencyLikelihood);
    probabilities.set(number, updatedProb);
  });
}

/**
 * Update probabilities with follow-on evidence
 */
function updateWithFollowOnEvidence(
  probabilities: Map<number, number>,
  historicalDraws: DrawRecord[],
  lastDrawNumbers: number[]
): void {
  const followOnMap = analyzeFollowOnPatterns(historicalDraws);

  // Calculate follow-on probabilities for each number from last draw
  const followOnWeight = 0.3; // How much we trust follow-on evidence

  lastDrawNumbers.forEach(triggerNumber => {
    if (followOnMap.has(triggerNumber)) {
      const followers = followOnMap.get(triggerNumber)!;
      const totalFollows = Array.from(followers.values()).reduce((sum, count) => sum + count, 0);

      followers.forEach((count, followerNumber) => {
        const currentProb = probabilities.get(followerNumber) || 0;
        const followOnLikelihood = count / totalFollows;

        // Bayesian update for follow-on patterns
        const updatedProb = currentProb * (1 + followOnWeight * followOnLikelihood);
        probabilities.set(followerNumber, updatedProb);
      });
    }
  });
}

/**
 * Update probabilities with temporal evidence (recent trends)
 */
function updateWithTemporalEvidence(
  probabilities: Map<number, number>,
  historicalDraws: DrawRecord[]
): void {
  const recentDraws = historicalDraws.slice(-20); // Last 20 draws
  const olderDraws = historicalDraws.slice(0, -20);

  if (recentDraws.length === 0 || olderDraws.length === 0) return;

  const recentFrequency = calculateFrequency(recentDraws);
  const olderFrequency = calculateFrequency(olderDraws);

  const temporalWeight = 0.2; // How much we trust recent trends

  probabilities.forEach((currentProb, number) => {
    const recentFreq = recentFrequency.get(number) || 0;
    const olderFreq = olderFrequency.get(number) || 0;

    // Calculate trend: positive if appearing more recently
    const trend = recentFreq - olderFreq;
    const trendLikelihood = Math.max(0, trend) / Math.max(1, recentFreq + olderFreq);

    const updatedProb = currentProb * (1 + temporalWeight * trendLikelihood);
    probabilities.set(number, updatedProb);
  });
}

/**
 * Update probabilities with gap analysis evidence
 */
function updateWithGapAnalysisEvidence(
  probabilities: Map<number, number>,
  historicalDraws: DrawRecord[]
): void {
  const gapMap = calculateGapAnalysis(historicalDraws);
  const gapWeight = 0.1; // How much we trust gap analysis

  probabilities.forEach((currentProb, number) => {
    const gapInfo = gapMap.get(number);
    if (!gapInfo) return;

    const { currentGap, averageGap } = gapInfo;

    // Numbers that are "due" (current gap > average gap) get higher probability
    const gapLikelihood = Math.max(0, currentGap - averageGap) / Math.max(1, averageGap);

    const updatedProb = currentProb * (1 + gapWeight * gapLikelihood);
    probabilities.set(number, updatedProb);
  });
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

/**
 * Calculate frequency of numbers in draws
 */
function calculateFrequency(draws: DrawRecord[]): Map<number, number> {
  const frequencyMap = new Map<number, number>();

  for (const draw of draws) {
    for (const num of draw.winningNumbers) {
      frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
    }
    frequencyMap.set(draw.specialNumber, (frequencyMap.get(draw.specialNumber) || 0) + 1);
  }

  return frequencyMap;
}

/**
 * Calculate gap analysis for numbers
 */
function calculateGapAnalysis(historicalDraws: DrawRecord[]): Map<number, { currentGap: number; averageGap: number }> {
  const gapMap = new Map<number, { currentGap: number; averageGap: number }>();
  const lastAppearance = new Map<number, number>();
  const appearanceCount = new Map<number, number>();
  const totalGaps = new Map<number, number>();

  // Track appearances and calculate gaps
  for (let i = 0; i < historicalDraws.length; i++) {
    const draw = historicalDraws[i];
    const allNumbers = [...draw.winningNumbers, draw.specialNumber];

    for (const num of allNumbers) {
      if (lastAppearance.has(num)) {
        const gap = i - lastAppearance.get(num)!;
        totalGaps.set(num, (totalGaps.get(num) || 0) + gap);
        appearanceCount.set(num, (appearanceCount.get(num) || 0) + 1);
      }
      lastAppearance.set(num, i);
    }
  }

  // Calculate current gap and average gap for each number
  const lastDrawIndex = historicalDraws.length - 1;
  for (let num = 1; num <= 49; num++) {
    const currentGap = lastDrawIndex - (lastAppearance.get(num) || -1);
    const avgGap = totalGaps.has(num) ? totalGaps.get(num)! / appearanceCount.get(num)! : historicalDraws.length;

    gapMap.set(num, { currentGap, averageGap: avgGap });
  }

  return gapMap;
}

/**
 * Create selection pool based on probabilities
 */
function createProbabilityPool(probabilities: Map<number, number>): number[] {
  const pool: number[] = [];

  probabilities.forEach((probability, number) => {
    // Add numbers to pool proportional to their probability
    const count = Math.max(1, Math.floor(probability * 1000));
    for (let i = 0; i < count; i++) {
      pool.push(number);
    }
  });

  return pool;
}

/**
 * Normalize probabilities to sum to 1
 */
function normalizeProbabilities(probabilities: Map<number, number>): void {
  const total = Array.from(probabilities.values()).reduce((sum, prob) => sum + prob, 0);

  if (total > 0) {
    probabilities.forEach((prob, number) => {
      probabilities.set(number, prob / total);
    });
  }
}

/**
 * Get Bayesian probability distribution for analysis
 */
export function getBayesianProbabilities(
  historicalDraws: DrawRecord[],
  lastDrawNumbers?: number[]
): Array<{ number: number; probability: number }> {
  const probabilities = calculateBayesianProbabilities(historicalDraws, lastDrawNumbers);

  return Array.from(probabilities.entries())
    .map(([number, probability]) => ({ number, probability }))
    .sort((a, b) => b.probability - a.probability);
}