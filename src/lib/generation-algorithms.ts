// Mark Six Number Generation Algorithms
// Implementation based on the reference MarkSizAPI.js

import { prisma } from '@/lib/prisma';

// These interfaces are kept for future reference but currently unused
// interface DrawResult {
//   winning_numbers: number[];
//   special_number: number;
//   draw_date: string;
// }

// interface FollowOnPattern {
//   trigger_number: number;
//   follow_number: number;
//   frequency: number;
// }

interface ScoreResult {
  totalScore: number;
  subScoreMapping: Record<number, number>;
  subNumberDistribution: Array<{ number: number; frequency: number }>;
  frequenceFactor: number;
}

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

/**
 * V1 Generation Algorithm - Statistical Analysis
 * Based on historical frequency and pattern analysis
 * Aligned with reference implementation from MarkSizAPI.js
 */
export async function generateV1Combinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean
): Promise<number[][]> {
  try {
    // Get past results for analysis (369 days of data as per reference)
    const daysOfHistory = 369;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOfHistory);

    const pastResults = await prisma.markSixResult.findMany({
      select: {
        winningNumbers: true,
        specialNumber: true
      },
      where: {
        drawDate: {
          gte: cutoffDate
        }
      },
      orderBy: { drawDate: 'asc' }
    });

    const parsedResults = pastResults.map(r => ({
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
      const candidate = await generateNumbersImpl(combinationCount, selectedNumbers, luckyNumber, isDouble);
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

    console.log("V1 Generation - Best candidate:", { bestCandidate, highestScore, scoreDistribution, numberDistribution });

    return bestCandidate || await generateNumbersImpl(combinationCount, selectedNumbers, luckyNumber, isDouble);
  } catch (error) {
    console.error('V1 Generation Failed:', error);
    // Fallback to basic generation
    return generateNumbersImpl(combinationCount, selectedNumbers, luckyNumber, isDouble);
  }
}

/**
 * V2 Generation Algorithm - Follow-on Pattern Analysis
 * Based on statistical relationships between consecutive draws
 * Aligned with reference implementation from MarkSizAPI.js
 */
export async function generateV2Combinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  daysOfHistory: number = 1095
): Promise<number[][]> {
  try {
    const DEBUG = false; // Set to true for detailed logging as in reference

    if (DEBUG) {
      console.log("--- Starting generateV2Combinations ---");
      console.log(`Combinations to Generate: ${combinationCount}`);
      console.log(`User Selected Numbers: [${selectedNumbers.join(', ')}]`);
      console.log(`Lucky Number: ${luckyNumber}`);
      console.log(`Is Double: ${isDouble}`);
      console.log(`Analyzing History: ${daysOfHistory} days`);
      console.log("------------------------------------");
    }

    const followOnPatterns = await analyzeFollowOnPatterns(daysOfHistory);

    // Get the last draw (7 days ago as per reference)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const lastDrawList = await prisma.markSixResult.findMany({
      select: {
        winningNumbers: true,
        specialNumber: true
      },
      where: {
        drawDate: {
          gte: sevenDaysAgo
        }
      },
      orderBy: { drawDate: 'desc' },
      take: 1
    });

    if (!lastDrawList || lastDrawList.length === 0) {
      throw new Error("Could not fetch the last Mark Six result.");
    }

    const lastDraw = lastDrawList[0];
    const lastDrawNumbers = [...lastDraw.winningNumbers, lastDraw.specialNumber];

    if (DEBUG) console.log(`[DEBUG] Using last draw numbers as trigger: [${lastDrawNumbers.join(', ')}]`);

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

    if (DEBUG) {
      const sortedWeightedPool = Array.from(weightedPool.entries()).sort((a, b) => b[1] - a[1]);
      console.log(`[DEBUG] Top 15 numbers in weighted pool (Number => Weight):`);
      console.log(sortedWeightedPool.slice(0, 15).map(([num, weight]) => `${num} => ${weight}`).join(' | '));
      console.log("------------------------------------");
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
      if (DEBUG) console.log(`\n--- Generating Combination #${i + 1} ---`);
      const combination = new Set<number>();

      // Always include lucky number
      combination.add(luckyNumber);
      if (DEBUG) console.log(`[DEBUG] Added Lucky Number: ${luckyNumber}`);

      // Include selected numbers if provided
      const userSelectionPool = selectedNumbers.filter(n => n !== luckyNumber);
      userSelectionPool.sort(() => 0.5 - Math.random());

      let userPickIndex = 0;
      while (combination.size < combinationLength && userPickIndex < userSelectionPool.length) {
        const selectedNum = userSelectionPool[userPickIndex];
        combination.add(selectedNum);
        if (DEBUG) console.log(`[DEBUG] Added from User Selection: ${selectedNum}`);
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
            if (DEBUG) console.log(`[DEBUG] Added from Weighted Pool: ${pickedNumber}`);
          }
        } else {
          const randomNum = Math.floor(Math.random() * 49) + 1;
          if (!combination.has(randomNum)) {
            combination.add(randomNum);
            if (DEBUG) console.log(`[DEBUG] Added from Fallback Random: ${randomNum}`);
          }
        }
        attempts++;
      }

      const finalCombination = Array.from(combination);
      finalCombination.sort((a, b) => a - b);

      if (finalCombination.length === combinationLength) {
        generatedCombinations.push(finalCombination);
        if (DEBUG) console.log(`[SUCCESS] Final Combination #${i + 1}: [${finalCombination.join(', ')}]`);
      } else {
        if (DEBUG) console.warn(`[FAIL] Could not generate a valid combination of length ${combinationLength}. Current size: ${finalCombination.length}. Skipping.`);
      }
    }

    if (DEBUG) {
      console.log("\n--- Generation Complete ---");
      console.log(`Total combinations generated: ${generatedCombinations.length}`);
      console.log("---------------------------\n");
    }

    return generatedCombinations;
  } catch (error) {
    console.error('V2 Generation Failed:', error);
    // Fallback to basic generation
    return generateNumbersImpl(combinationCount, selectedNumbers, luckyNumber, isDouble);
  }
}

/**
 * Basic number generation implementation
 */
async function generateNumbersImpl(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean
): Promise<number[][]> {
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
function checkScore(candidate: number[][], parsedResults: Array<{ nos: number[]; sno: number }>): ScoreResult {
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
 * Analyze follow-on patterns from historical data
 */
async function analyzeFollowOnPatterns(daysOfHistory: number): Promise<Map<number, Map<number, number>>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOfHistory);

  const historicalDraws = await prisma.markSixResult.findMany({
    select: {
      drawDate: true,
      winningNumbers: true,
      specialNumber: true
    },
    where: {
      drawDate: {
        gte: cutoffDate
      }
    },
    orderBy: { drawDate: 'asc' }
  });

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

// Placeholder functions for AI and QiMen generation
export async function generateAICombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean
): Promise<number[][]> {
  // TODO: Implement AI generation using external API
  return generateNumbersImpl(combinationCount, selectedNumbers, luckyNumber, isDouble);
}

export async function generateQiMenCombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean
): Promise<number[][]> {
  // TODO: Implement Qi Men Dun Jia generation
  return generateNumbersImpl(combinationCount, selectedNumbers, luckyNumber, isDouble);
}