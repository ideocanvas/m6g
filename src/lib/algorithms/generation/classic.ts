import { DrawRecord, ClassicResult } from '../types';

interface NumberProbability {
  number: number;
  probability: number;
}

/**
 * Classic generation algorithm based on statistical analysis
 * Pure function that only depends on input parameters (IoC pattern)
 * Corresponds to the original V1 generation logic
 */
export function generateClassicCombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  historicalDraws: DrawRecord[]
): ClassicResult[] {
  if (!historicalDraws || historicalDraws.length === 0) {
    throw new Error('No historical data provided');
  }

  const parsedResults = historicalDraws.map(r => ({
    nos: r.winningNumbers,
    sno: r.specialNumber
  }));

  let bestCandidate: number[][] | null = null;
  let highestScore = -1;
  let scoreDistribution: Record<number, number> | null = null;
  let numberDistribution: Array<{ number: number; frequency: number }> | null = null;
  const allCandidates: Array<{
    candidate: number[][];
    totalScore: number;
    frequenceFactor: number;
    subScoreMapping: Record<number, number>;
    subNumberDistribution: Array<{ number: number; frequency: number }>;
  }> = [];
  let totalFrequenceFactor = 0;
  const frequenceFactors: number[] = [];

  // Generate candidates and calculate frequenceFactor (963 iterations as per reference)
  for (let i = 0; i < 963; i++) {
    const candidate = generateNumbersImpl(combinationCount, selectedNumbers, luckyNumber, isDouble);
    const { totalScore, subScoreMapping, subNumberDistribution, frequenceFactor } = checkScore(candidate, parsedResults);
    allCandidates.push({ candidate, totalScore, frequenceFactor, subScoreMapping, subNumberDistribution });
    totalFrequenceFactor += frequenceFactor;
    frequenceFactors.push(frequenceFactor);
  }

  // Calculate average and standard deviation of frequenceFactor
  const averageFrequenceFactor = totalFrequenceFactor / frequenceFactors.length;
  const variance = frequenceFactors.reduce((acc, ff) => acc + Math.pow(ff - averageFrequenceFactor, 2), 0) / frequenceFactors.length;
  const standardDeviation = Math.sqrt(variance);
  const threshold = averageFrequenceFactor + standardDeviation;

  // Filter candidates by frequenceFactor greater than the threshold
  const filteredCandidates = allCandidates.filter(c => c.frequenceFactor > threshold);

  // Determine the best candidate based on totalScore
  for (const { candidate, totalScore, subScoreMapping, subNumberDistribution } of filteredCandidates) {
    if (totalScore > highestScore) {
      highestScore = totalScore;
      bestCandidate = candidate;
      scoreDistribution = subScoreMapping;
      numberDistribution = subNumberDistribution;
    }
  }

  const finalCombinations = bestCandidate || generateNumbersImpl(combinationCount, selectedNumbers, luckyNumber, isDouble);

  // For double combinations, calculate split numbers based on least winning probability
  const results = finalCombinations.map((combination, index) => {
    let splitNumbers: number[] = [];
    
    if (isDouble && combination.length === 7) {
      // Calculate which two numbers have the least chance to win
      splitNumbers = calculateSplitNumbers(combination, historicalDraws);
    }

    return {
      combination,
      sequenceNumber: index + 1,
      score: highestScore,
      scoreDistribution: scoreDistribution || undefined,
      numberDistribution: numberDistribution || undefined,
      splitNumbers: splitNumbers.length > 0 ? splitNumbers : undefined
    };
  });

  return results;
}

/**
 * Basic number generation implementation
 */
function generateNumbersImpl(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean
): number[][] {
  const generatedCombinations: number[][] = [];

  for (let i = 0; i < combinationCount; i++) {
    const combination = [luckyNumber];

    if (selectedNumbers.length > 0) {
      while (combination.length < (isDouble ? 5 : 6)) {
        const num = selectedNumbers[Math.floor(Math.random() * selectedNumbers.length)];
        if (!combination.includes(num)) {
          combination.push(num);
        }
      }
    } else {
      while (combination.length < (isDouble ? 5 : 6)) {
        const num = Math.floor(Math.random() * 49) + 1;
        if (!combination.includes(num)) {
          combination.push(num);
        }
      }
    }

    combination.sort((a, b) => a - b);

    if (isDouble) {
      const combination2: number[] = [];
      if (selectedNumbers.length > 0) {
        while (combination2.length < 2) {
          const num = selectedNumbers[Math.floor(Math.random() * selectedNumbers.length)];
          if (!combination.includes(num) && !combination2.includes(num)) {
            combination2.push(num);
          }
        }
      } else {
        while (combination2.length < 2) {
          const num = Math.floor(Math.random() * 49) + 1;
          if (!combination.includes(num) && !combination2.includes(num)) {
            combination2.push(num);
          }
        }
      }
      combination2.sort((a, b) => a - b);
      combination.push(...combination2);
    }

    generatedCombinations.push(combination);
  }

  return generatedCombinations;
}

/**
 * Score calculation for candidate combinations
 */
function checkScore(candidate: number[][], parsedResults: Array<{ nos: number[]; sno: number }>): {
  totalScore: number;
  frequenceFactor: number;
  subScoreMapping: Record<number, number>;
  subNumberDistribution: Array<{ number: number; frequency: number }>;
} {
  const SCORE_MAP: Record<number, number> = {
    0: 0,
    0.5: 0.5,
    1: 1,
    1.5: 1.5,
    2: 2,
    2.5: 2.5,
    3: 3,
    3.5: 3.5,
    4: 4,
    4.5: 4.5,
    5: 5,
    5.5: 5.5,
    6: 6,
  };

  let totalScore = 0;
  let frequenceFactor = 0;
  const subScoreMapping: Record<number, number> = {};
  const numberFrequency: Record<number, number> = {};

  // Calculate frequency of each number in candidate combinations
  for (const combination of candidate) {
    for (const number of combination) {
      numberFrequency[number] = (numberFrequency[number] || 0) + 1;
    }
  }

  const maxFrequency = Math.max(...Object.values(numberFrequency));

  for (const combination of candidate) {
    frequenceFactor += combination.reduce((acc, number) =>
      acc + (1 - (numberFrequency[number] / maxFrequency)), 0) / combination.length;
  }

  for (const combination of candidate) {
    let score = 0;
    for (const result of parsedResults) {
      let subScore = 0;
      for (const number of combination) {
        if (result.nos.includes(number)) {
          subScore += 1;
        }
      }
      if (combination.includes(result.sno)) {
        subScore += 0.5;
      }

      subScoreMapping[subScore] = (subScoreMapping[subScore] || 0) + 1;
      subScore = SCORE_MAP[subScore] || 0;
      score += subScore;
    }
    totalScore += score;
  }

  const subNumberDistribution = Object.keys(numberFrequency).map(num => ({
    number: parseInt(num, 10),
    frequency: numberFrequency[parseInt(num, 10)]
  }));

  return { totalScore, subScoreMapping, subNumberDistribution, frequenceFactor };
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