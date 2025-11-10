import { DrawRecord, EnsembleResult } from './types';
import { generateClassicCombinations } from './classic-combinations';
import { generateFollowOnCombinations } from './follow-on-combinations';
import { getHistoricalFrequency } from './frequency';
import { getFollowOnNumbers } from './follow-on';

/**
 * Ensemble generation algorithm combining multiple statistical models
 * Uses weighted combination of classic, follow-on, frequency, and Bayesian approaches
 * Pure function that only depends on input parameters (IoC pattern)
 */
export function generateEnsembleCombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  historicalDraws: DrawRecord[],
  lastDrawNumbers?: number[]
): EnsembleResult[] {
  if (!historicalDraws || historicalDraws.length === 0) {
    throw new Error('No historical data provided');
  }

  // Calculate model weights based on recent performance
  const modelWeights = calculateModelWeights(historicalDraws);
  
  // Generate combinations from each model
  const classicResults = generateClassicCombinations(
    combinationCount * 2, // Generate more for selection
    selectedNumbers,
    luckyNumber,
    isDouble,
    historicalDraws
  );

  const followOnResults = lastDrawNumbers ? generateFollowOnCombinations(
    combinationCount * 2,
    selectedNumbers,
    luckyNumber,
    isDouble,
    historicalDraws,
    lastDrawNumbers
  ) : [];

  // Get frequency-based numbers
  const frequencyResults = getHistoricalFrequency(historicalDraws, 'hot');
  const frequencyNumbers = frequencyResults.slice(0, 15).map(r => r.number);

  // Get follow-on numbers for Bayesian integration
  const followOnPatterns = lastDrawNumbers ? getFollowOnNumbers(historicalDraws) : [];
  const followOnNumbers = followOnPatterns.slice(0, 15).map(r => r.number);

  // Generate Bayesian-weighted combinations
  const bayesianResults = generateBayesianCombinations(
    combinationCount * 2,
    selectedNumbers,
    luckyNumber,
    isDouble,
    historicalDraws,
    frequencyNumbers,
    followOnNumbers
  );

  // Combine all candidates with weighted selection
  const allCandidates = [
    ...classicResults.map(r => ({ combination: r.combination, model: 'classic' as const })),
    ...followOnResults.map(r => ({ combination: r.combination, model: 'followOn' as const })),
    ...bayesianResults.map(r => ({ combination: r.combination, model: 'bayesian' as const }))
  ];

  // Score and select best combinations
  const scoredCandidates = scoreCandidates(allCandidates, historicalDraws, modelWeights);
  
  // Select top combinations with diversity
  const finalCombinations = selectDiverseCombinations(scoredCandidates, combinationCount);

  return finalCombinations.map(({ combination, confidence }, index) => ({
    combination,
    sequenceNumber: index + 1,
    modelWeights,
    confidence
  }));
}

/**
 * Calculate dynamic weights for each model based on recent performance
 */
function calculateModelWeights(historicalDraws: DrawRecord[]): { classic: number; followOn: number; frequency: number; bayesian: number } {
  if (historicalDraws.length < 20) {
    // Default weights for insufficient data
    return { classic: 0.3, followOn: 0.3, frequency: 0.2, bayesian: 0.2 };
  }

  // Use last 20% of data for performance evaluation
  const testSize = Math.max(10, Math.floor(historicalDraws.length * 0.2));
  const testData = historicalDraws.slice(-testSize);
  const trainingData = historicalDraws.slice(0, -testSize);

  // Calculate performance scores for each model
  const scores = {
    classic: evaluateModelPerformance('classic', trainingData, testData),
    followOn: evaluateModelPerformance('followOn', trainingData, testData),
    frequency: evaluateModelPerformance('frequency', trainingData, testData),
    bayesian: evaluateModelPerformance('bayesian', trainingData, testData)
  };

  // Normalize weights to sum to 1
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  return {
    classic: scores.classic / totalScore,
    followOn: scores.followOn / totalScore,
    frequency: scores.frequency / totalScore,
    bayesian: scores.bayesian / totalScore
  };
}

/**
 * Evaluate model performance on test data
 */
function evaluateModelPerformance(
  modelType: 'classic' | 'followOn' | 'frequency' | 'bayesian',
  trainingData: DrawRecord[],
  testData: DrawRecord[]
): number {
  let totalScore = 0;
  
  for (let i = 0; i < testData.length - 1; i++) {
    const currentDraw = testData[i];
    const nextDraw = testData[i + 1];
    
    // Generate predictions using the model
    const predictions = generateModelPredictions(modelType, trainingData, currentDraw);
    
    // Score predictions against actual next draw
    const score = calculatePredictionScore(predictions, nextDraw);
    totalScore += score;
  }
  
  return Math.max(0.1, totalScore / (testData.length - 1)); // Minimum weight of 0.1
}

/**
 * Generate predictions for a specific model
 */
function generateModelPredictions(
  modelType: 'classic' | 'followOn' | 'frequency' | 'bayesian',
  trainingData: DrawRecord[],
  currentDraw: DrawRecord
): number[] {
  switch (modelType) {
    case 'classic':
      const classicResults = generateClassicCombinations(5, [], 0, false, trainingData);
      return classicResults[0]?.combination || [];
      
    case 'followOn':
      const lastNumbers = [...currentDraw.winningNumbers, currentDraw.specialNumber];
      const followOnResults = generateFollowOnCombinations(5, [], 0, false, trainingData, lastNumbers);
      return followOnResults[0]?.combination || [];
      
    case 'frequency':
      const frequencyResults = getHistoricalFrequency(trainingData, 'hot');
      return frequencyResults.slice(0, 6).map(r => r.number);
      
    case 'bayesian':
      const frequencyNums = getHistoricalFrequency(trainingData, 'hot').slice(0, 10).map(r => r.number);
      const followOnNums = getFollowOnNumbers(trainingData).slice(0, 10).map(r => r.number);
      const bayesianResults = generateBayesianCombinations(5, [], 0, false, trainingData, frequencyNums, followOnNums);
      return bayesianResults[0]?.combination || [];
      
    default:
      return [];
  }
}

/**
 * Calculate prediction score based on match with actual draw
 */
function calculatePredictionScore(predictions: number[], actualDraw: DrawRecord): number {
  let score = 0;
  
  // Check main numbers
  for (const num of predictions) {
    if (actualDraw.winningNumbers.includes(num)) {
      score += 2; // Higher weight for main numbers
    }
  }
  
  // Check special number
  if (predictions.includes(actualDraw.specialNumber)) {
    score += 1;
  }
  
  return score;
}

/**
 * Generate Bayesian-weighted combinations
 */
function generateBayesianCombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  historicalDraws: DrawRecord[],
  frequencyNumbers: number[],
  followOnNumbers: number[]
): { combination: number[] }[] {
  const combinations: { combination: number[] }[] = [];
  const combinationLength = isDouble ? 7 : 6;
  
  // Calculate Bayesian probabilities
  const probabilities = calculateBayesianProbabilities(historicalDraws, frequencyNumbers, followOnNumbers);
  
  for (let i = 0; i < combinationCount; i++) {
    const combination = new Set<number>();
    
    // Always include lucky number
    combination.add(luckyNumber);
    
    // Include selected numbers
    const userSelectionPool = selectedNumbers.filter(n => n !== luckyNumber);
    userSelectionPool.sort(() => 0.5 - Math.random());
    
    let userPickIndex = 0;
    while (combination.size < combinationLength && userPickIndex < userSelectionPool.length) {
      combination.add(userSelectionPool[userPickIndex]);
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
        }
      } else {
        // Fallback to random selection
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
      combinations.push({ combination: finalCombination });
    }
  }
  
  return combinations;
}

/**
 * Calculate Bayesian probabilities combining multiple factors
 */
function calculateBayesianProbabilities(
  historicalDraws: DrawRecord[],
  frequencyNumbers: number[],
  followOnNumbers: number[]
): Map<number, number> {
  const probabilities = new Map<number, number>();
  
  // Initialize with uniform prior
  for (let i = 1; i <= 49; i++) {
    probabilities.set(i, 1/49);
  }
  
  // Update with frequency evidence
  const frequencyWeight = 0.4;
  frequencyNumbers.forEach((num, index) => {
    const currentProb = probabilities.get(num) || 0;
    const frequencyBoost = frequencyWeight * (1 - index / frequencyNumbers.length);
    probabilities.set(num, currentProb + frequencyBoost);
  });
  
  // Update with follow-on evidence
  const followOnWeight = 0.3;
  followOnNumbers.forEach((num, index) => {
    const currentProb = probabilities.get(num) || 0;
    const followOnBoost = followOnWeight * (1 - index / followOnNumbers.length);
    probabilities.set(num, currentProb + followOnBoost);
  });
  
  // Normalize probabilities
  const total = Array.from(probabilities.values()).reduce((sum, prob) => sum + prob, 0);
  probabilities.forEach((prob, num) => {
    probabilities.set(num, prob / total);
  });
  
  return probabilities;
}

/**
 * Create selection pool based on probabilities
 */
function createProbabilityPool(probabilities: Map<number, number>): number[] {
  const pool: number[] = [];
  
  probabilities.forEach((probability, number) => {
    const count = Math.max(1, Math.floor(probability * 1000));
    for (let i = 0; i < count; i++) {
      pool.push(number);
    }
  });
  
  return pool;
}

/**
 * Score candidates using ensemble weights
 */
function scoreCandidates(
  candidates: Array<{ combination: number[]; model: string }>,
  historicalDraws: DrawRecord[],
  modelWeights: { classic: number; followOn: number; frequency: number; bayesian: number }
): Array<{ combination: number[]; score: number; confidence: number }> {
  return candidates.map(({ combination, model }) => {
    const modelWeight = modelWeights[model as keyof typeof modelWeights] || 0.25;
    
    // Calculate combination quality score
    const qualityScore = calculateCombinationQuality(combination, historicalDraws);
    
    // Calculate diversity score (avoid similar combinations)
    const diversityScore = calculateDiversityScore(combination, candidates);
    
    const totalScore = modelWeight * qualityScore + (1 - modelWeight) * diversityScore;
    const confidence = Math.min(1, totalScore / 2); // Normalize to 0-1 range
    
    return {
      combination,
      score: totalScore,
      confidence
    };
  });
}

/**
 * Calculate combination quality based on historical patterns
 */
function calculateCombinationQuality(combination: number[], historicalDraws: DrawRecord[]): number {
  let score = 0;
  
  // Check against recent draws for pattern matching
  const recentDraws = historicalDraws.slice(-20);
  
  for (const draw of recentDraws) {
    let matchScore = 0;
    
    // Check main number matches
    for (const num of combination) {
      if (draw.winningNumbers.includes(num)) {
        matchScore += 2;
      }
    }
    
    // Check special number match
    if (combination.includes(draw.specialNumber)) {
      matchScore += 1;
    }
    
    // Higher score for moderate matches (not too high, not too low)
    if (matchScore >= 2 && matchScore <= 4) {
      score += 1;
    }
  }
  
  return score / recentDraws.length;
}

/**
 * Calculate diversity score to avoid similar combinations
 */
function calculateDiversityScore(
  combination: number[],
  allCandidates: Array<{ combination: number[] }>
): number {
  let minSimilarity = 1;
  
  for (const other of allCandidates) {
    if (other.combination !== combination) {
      const similarity = calculateSimilarity(combination, other.combination);
      minSimilarity = Math.min(minSimilarity, similarity);
    }
  }
  
  return 1 - minSimilarity; // Higher score for more diversity
}

/**
 * Calculate similarity between two combinations
 */
function calculateSimilarity(comb1: number[], comb2: number[]): number {
  const set1 = new Set(comb1);
  const set2 = new Set(comb2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  return intersection.size / Math.max(set1.size, set2.size);
}

/**
 * Select diverse combinations with highest scores
 */
function selectDiverseCombinations(
  scoredCandidates: Array<{ combination: number[]; score: number; confidence: number }>,
  count: number
): Array<{ combination: number[]; confidence: number }> {
  // Sort by score descending
  const sorted = [...scoredCandidates].sort((a, b) => b.score - a.score);
  
  const selected: Array<{ combination: number[]; confidence: number }> = [];
  const usedNumbers = new Set<number>();
  
  for (const candidate of sorted) {
    if (selected.length >= count) break;
    
    // Check if this combination adds diversity
    const candidateNumbers = new Set(candidate.combination);
    const overlap = new Set([...candidateNumbers].filter(x => usedNumbers.has(x)));
    
    if (overlap.size <= 2) { // Allow some overlap for natural patterns
      selected.push({
        combination: candidate.combination,
        confidence: candidate.confidence
      });
      
      // Add numbers to used set
      candidate.combination.forEach(num => usedNumbers.add(num));
    }
  }
  
  // If we don't have enough diverse combinations, take the highest scoring ones
  if (selected.length < count) {
    const remainingNeeded = count - selected.length;
    const remainingCandidates = sorted
      .filter(candidate => !selected.some(s => s.combination === candidate.combination))
      .slice(0, remainingNeeded);
    
    selected.push(...remainingCandidates.map(c => ({
      combination: c.combination,
      confidence: c.confidence
    })));
  }
  
  return selected;
}
