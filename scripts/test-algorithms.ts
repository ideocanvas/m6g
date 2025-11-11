#!/usr/bin/env tsx

/**
 * Test Program for Mark Six Algorithms
 *
 * This program tests the algorithms in src/lib/algorithms against historical draw results.
 * It queries the database once for all required data and processes everything in memory.
 *
 * Usage: pnpm tsx scripts/test-algorithms.ts [testYear] [algorithm]
 * Examples:
 *   pnpm tsx scripts/test-algorithms.ts 2024 classic
 *   pnpm tsx scripts/test-algorithms.ts 2023 follow_on
 *   pnpm tsx scripts/test-algorithms.ts 2024 ensemble
 *   pnpm tsx scripts/test-algorithms.ts 2024 bayesian
 *
 * Note: Ensemble algorithm includes detailed timing logs to track performance
 */

import {
  getHistoricalFrequency,
  getFollowOnNumbers,
  generateRandomNumbers,
  generateBalancedNumbers,
  generateClassicCombinations,
  generateClassicCombinationsOptimized,
  generateFollowOnCombinations,
  generateEnsembleCombinations,
  generateBayesianCombinations,
  generateAdvancedFollowOnCombinations
} from '../src/lib/algorithms';
import { DrawRecord } from '../src/lib/algorithms/types';

// Load real draw data from JSON file
async function getRealDrawData(): Promise<DrawRecord[]> {
  console.log('Loading real Mark Six data from JSON file');

  const fs = await import('fs');
  const path = await import('path');

  const filePath = path.join(process.cwd(), 'docs/data/UfxCdaMarksixResults.json');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Real data file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(fileContent);

  const drawRecords: DrawRecord[] = [];

  for (const result of data.UfxCdaMarksixResults) {
    // Parse winning numbers from "no" field (format: "7+16+26+31+47+49")
    const winningNumbers = result.no.split('+').map((num: string) => parseInt(num.trim(), 10));

    // Parse special number from "sno" field
    const specialNumber = parseInt(result.sno, 10);

    // Parse draw date
    const drawDate = new Date(result.drawDate);

    drawRecords.push({
      winningNumbers,
      specialNumber,
      drawDate
    });
  }

  // Sort by draw date ascending
  drawRecords.sort((a, b) => a.drawDate!.getTime() - b.drawDate!.getTime());

  console.log(`Loaded ${drawRecords.length} real draw records`);
  return drawRecords;
}

// Types for our test program
interface TestConfig {
  testYear: number;
  yearsOfHistory: number;
  algorithm: 'classic' | 'classic_optimized' | 'follow_on' | 'ensemble' | 'bayesian' | 'advanced_follow_on';
}

interface CombinationType {
  name: string;
  combinationCount: number;
  isDouble: boolean;
}

interface SuggestionAlgorithm {
  name: string;
  type: 'hot_follow_on' | 'hot' | 'cold' | 'random' | 'balanced';
}

interface GenerationAlgorithm {
  name: string;
  type: 'classic' | 'follow_on';
}

// Mark Six Prize Categories
interface PrizeCategory {
  name: string;
  description: string;
  matchCondition: (matchedWinning: number, matchedSpecial: boolean) => boolean;
  prizeAmount: number; // Fixed prize amount or 0 for variable prizes
}

interface PrizeResult {
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
  fourthPrize: number;
  fifthPrize: number;
  sixthPrize: number;
  seventhPrize: number;
  totalPrize: number;
  totalCombinations: number;
}

interface TestResult {
  drawDate: Date;
  combinationType: string;
  suggestionAlgorithm: string;
  generationAlgorithm: string;
  selectedNumbers: number[];
  generatedCombinations: number[][];
  actualDraw: DrawRecord;
  prizeResults: PrizeResult;
}

interface SummaryStats {
  combinationType: string;
  suggestionAlgorithm: string;
  generationAlgorithm: string;
  totalDraws: number;
  totalCombinations: number;
  prizeDistribution: {
    firstPrize: number;
    secondPrize: number;
    thirdPrize: number;
    fourthPrize: number;
    fifthPrize: number;
    sixthPrize: number;
    seventhPrize: number;
  };
  totalPrizeAmount: number;
  averagePrizePerCombination: number;
  hitRate: number; // Percentage of combinations that won any prize
}

// Combination types to test (all common combinations)
const COMBINATION_TYPES: CombinationType[] = [
  { name: '4x1', combinationCount: 4, isDouble: false },
  { name: '4x2', combinationCount: 4, isDouble: true },
  { name: '8x1', combinationCount: 8, isDouble: false },
  { name: '8x2', combinationCount: 8, isDouble: true },
  { name: '12x1', combinationCount: 12, isDouble: false },
  { name: '12x2', combinationCount: 12, isDouble: true },
  { name: '16x1', combinationCount: 16, isDouble: false },
  { name: '16x2', combinationCount: 16, isDouble: true },
  { name: '20x1', combinationCount: 20, isDouble: false },
  { name: '20x2', combinationCount: 20, isDouble: true },
  { name: '24x1', combinationCount: 24, isDouble: false },
  { name: '24x2', combinationCount: 24, isDouble: true },
  { name: '28x1', combinationCount: 28, isDouble: false },
  { name: '28x2', combinationCount: 28, isDouble: true },
  { name: '32x1', combinationCount: 32, isDouble: false },
  { name: '32x2', combinationCount: 32, isDouble: true },
];

// Suggestion algorithms to test (all algorithms)
const SUGGESTION_ALGORITHMS: SuggestionAlgorithm[] = [
  { name: 'Hot Follow-on', type: 'hot_follow_on' },
  { name: 'Hot Numbers', type: 'hot' },
  { name: 'Cold Numbers', type: 'cold' },
  { name: 'Random', type: 'random' },
  { name: 'Balanced', type: 'balanced' }
];

// Generation algorithms mapping
const GENERATION_ALGORITHMS: Record<string, GenerationAlgorithm> = {
  classic: { name: 'Classic (V1)', type: 'classic' },
  follow_on: { name: 'Follow-on (V2)', type: 'follow_on' },
  ensemble: { name: 'Ensemble', type: 'follow_on' }, // Note: ensemble uses follow_on type for compatibility
  bayesian: { name: 'Bayesian', type: 'follow_on' }, // Note: bayesian uses follow_on type for compatibility
  classic_optimized: { name: 'Classic Optimized', type: 'classic' }, // Note: classic_optimized uses classic type for compatibility
  advanced_follow_on: { name: 'Advanced Follow-on', type: 'follow_on' } // Note: advanced_follow_on uses follow_on type for compatibility
};

/**
 * Get numbers based on suggestion algorithm
 */
function getNumbersByAlgorithm(
  algorithm: SuggestionAlgorithm,
  historicalDraws: DrawRecord[],
  lastDrawNumbers?: number[]
): number[] {
  switch (algorithm.type) {
    case 'hot_follow_on':
      if (!lastDrawNumbers) {
        throw new Error('Last draw numbers required for hot follow-on algorithm');
      }
      const followOnResults = getFollowOnNumbers(historicalDraws);
      return followOnResults.slice(0, 15).map(r => r.number);

    case 'hot':
      const hotResults = getHistoricalFrequency(historicalDraws, 'hot');
      return hotResults.slice(0, 15).map(r => r.number);

    case 'cold':
      const coldResults = getHistoricalFrequency(historicalDraws, 'cold');
      return coldResults.slice(0, 15).map(r => r.number);

    case 'random':
      const randomResults = generateRandomNumbers();
      return randomResults.slice(0, 15).map(r => r.number);

    case 'balanced':
      const balancedResults = generateBalancedNumbers();
      return balancedResults.slice(0, 15).map(r => r.number);

    default:
      throw new Error(`Unknown algorithm type: ${algorithm.type}`);
  }
}

/**
 * Generate combinations using the appropriate algorithm
 */
function generateCombinations(
  combinationType: CombinationType,
  selectedNumbers: number[],
  historicalDraws: DrawRecord[],
  generationAlgorithm: GenerationAlgorithm,
  lastDrawNumbers?: number[]
): number[][] {
  // For this test, we'll use a random lucky number from selected numbers
  const luckyNumber = selectedNumbers.length > 0
    ? selectedNumbers[Math.floor(Math.random() * selectedNumbers.length)]
    : Math.floor(Math.random() * 49) + 1;

  if (generationAlgorithm.name === 'Ensemble') {
    // Use the ensemble algorithm
    const results = generateEnsembleCombinations(
      combinationType.combinationCount,
      selectedNumbers,
      luckyNumber,
      combinationType.isDouble,
      historicalDraws,
      lastDrawNumbers
    );
    return results.map((r: { combination: number[] }) => r.combination);
  } else if (generationAlgorithm.name === 'Bayesian') {
    // Use the bayesian algorithm
    const results = generateBayesianCombinations(
      combinationType.combinationCount,
      selectedNumbers,
      luckyNumber,
      combinationType.isDouble,
      historicalDraws,
      lastDrawNumbers
    );
    return results.map((r: { combination: number[] }) => r.combination);
  } else if (generationAlgorithm.name === 'Follow-on (V2)') {
    // Use the follow-on algorithm
    const results = generateFollowOnCombinations(
      combinationType.combinationCount,
      selectedNumbers,
      luckyNumber,
      combinationType.isDouble,
      historicalDraws,
      lastDrawNumbers || []
    );
    return results.map(r => r.combination);
  } else if (generationAlgorithm.name === 'Advanced Follow-on') {
    // Use the advanced follow-on algorithm
    const results = generateAdvancedFollowOnCombinations(
      combinationType.combinationCount,
      selectedNumbers,
      luckyNumber,
      combinationType.isDouble,
      historicalDraws
    );
    return results.map((r: { combination: number[] }) => r.combination);
  } else if (generationAlgorithm.name === 'Classic Optimized') {
    // Use the optimized classic algorithm
    const results = generateClassicCombinationsOptimized(
      combinationType.combinationCount,
      selectedNumbers,
      luckyNumber,
      combinationType.isDouble,
      historicalDraws
    );
    return results.map((r: { combination: number[] }) => r.combination);
  } else {
    // Default to classic algorithm
    const results = generateClassicCombinations(
      combinationType.combinationCount,
      selectedNumbers,
      luckyNumber,
      combinationType.isDouble,
      historicalDraws
    );
    return results.map((r: { combination: number[] }) => r.combination);
  }
}


// Mark Six Prize Categories
const PRIZE_CATEGORIES: PrizeCategory[] = [
  {
    name: 'First Prize',
    description: '選中6個「攪出號碼」',
    matchCondition: (matchedWinning) => matchedWinning === 6,
    prizeAmount: 8000000 // Variable prize, minimum HK$8,000,000
  },
  {
    name: 'Second Prize',
    description: '選中5個「攪出號碼」+「特別號碼」',
    matchCondition: (matchedWinning, matchedSpecial) => matchedWinning === 5 && matchedSpecial,
    prizeAmount: 200000 // Variable prize
  },
  {
    name: 'Third Prize',
    description: '選中5個「攪出號碼」',
    matchCondition: (matchedWinning, matchedSpecial) => matchedWinning === 5 && !matchedSpecial,
    prizeAmount: 50000 // Variable prize
  },
  {
    name: 'Fourth Prize',
    description: '選中4個「攪出號碼」+「特別號碼」',
    matchCondition: (matchedWinning, matchedSpecial) => matchedWinning === 4 && matchedSpecial,
    prizeAmount: 9600 // Fixed prize HK$9,600
  },
  {
    name: 'Fifth Prize',
    description: '選中4個「攪出號碼」',
    matchCondition: (matchedWinning, matchedSpecial) => matchedWinning === 4 && !matchedSpecial,
    prizeAmount: 640 // Fixed prize HK$640
  },
  {
    name: 'Sixth Prize',
    description: '選中3個「攪出號碼」+「特別號碼」',
    matchCondition: (matchedWinning, matchedSpecial) => matchedWinning === 3 && matchedSpecial,
    prizeAmount: 320 // Fixed prize HK$320
  },
  {
    name: 'Seventh Prize',
    description: '選中3個「攪出號碼」',
    matchCondition: (matchedWinning, matchedSpecial) => matchedWinning === 3 && !matchedSpecial,
    prizeAmount: 40 // Fixed prize HK$40
  }
];

/**
 * Calculate prize for a combination against actual draw
 */
function calculatePrize(combination: number[], actualDraw: DrawRecord): { prizeCategory: string; prizeAmount: number } {
  // Count matched winning numbers
  let matchedWinning = 0;
  for (const num of combination) {
    if (actualDraw.winningNumbers.includes(num)) {
      matchedWinning++;
    }
  }

  // Check if special number is matched
  const matchedSpecial = combination.includes(actualDraw.specialNumber);

  // Find matching prize category
  for (const category of PRIZE_CATEGORIES) {
    if (category.matchCondition(matchedWinning, matchedSpecial)) {
      return {
        prizeCategory: category.name,
        prizeAmount: category.prizeAmount
      };
    }
  }

  // No prize
  return { prizeCategory: 'No Prize', prizeAmount: 0 };
}

/**
 * Calculate prize results for all combinations
 */
function calculatePrizeResults(combinations: number[][], actualDraw: DrawRecord): PrizeResult {
  const result: PrizeResult = {
    firstPrize: 0,
    secondPrize: 0,
    thirdPrize: 0,
    fourthPrize: 0,
    fifthPrize: 0,
    sixthPrize: 0,
    seventhPrize: 0,
    totalPrize: 0,
    totalCombinations: combinations.length
  };

  for (const combination of combinations) {
    const { prizeCategory, prizeAmount } = calculatePrize(combination, actualDraw);

    switch (prizeCategory) {
      case 'First Prize':
        result.firstPrize++;
        result.totalPrize += prizeAmount;
        break;
      case 'Second Prize':
        result.secondPrize++;
        result.totalPrize += prizeAmount;
        break;
      case 'Third Prize':
        result.thirdPrize++;
        result.totalPrize += prizeAmount;
        break;
      case 'Fourth Prize':
        result.fourthPrize++;
        result.totalPrize += prizeAmount;
        break;
      case 'Fifth Prize':
        result.fifthPrize++;
        result.totalPrize += prizeAmount;
        break;
      case 'Sixth Prize':
        result.sixthPrize++;
        result.totalPrize += prizeAmount;
        break;
      case 'Seventh Prize':
        result.seventhPrize++;
        result.totalPrize += prizeAmount;
        break;
    }
  }

  return result;
}

/**
 * Main test runner
 */
async function runTest(config: TestConfig): Promise<void> {
  console.log(`Starting test for year ${config.testYear} with ${config.yearsOfHistory} years of history`);
  console.log(`Testing algorithm: ${config.algorithm}`);
  console.log('=' .repeat(80));

  // Calculate date range
  const testYearStart = new Date(config.testYear, 0, 1);
  const testYearEnd = new Date(config.testYear, 11, 31);
  const historyStart = new Date(config.testYear - config.yearsOfHistory, 0, 1);

  console.log(`Test period: ${testYearStart.toDateString()} to ${testYearEnd.toDateString()}`);
  console.log(`History period: ${historyStart.toDateString()} to ${testYearStart.toDateString()}`);

  // Get real data for testing
  console.log('\nLoading real Mark Six data for testing...');
  const allDrawRecords = await getRealDrawData();

  // Filter draw records to match the requested date range
  const drawRecords = allDrawRecords.filter(draw =>
    draw.drawDate && draw.drawDate >= historyStart && draw.drawDate <= testYearEnd
  );

  console.log(`Filtered ${drawRecords.length} draw records`);

  // Separate test draws from historical draws
  const testDraws = drawRecords.filter(draw =>
    draw.drawDate && draw.drawDate >= testYearStart && draw.drawDate <= testYearEnd
  );

  const historicalDraws = drawRecords.filter(draw =>
    draw.drawDate && draw.drawDate < testYearStart
  );

  console.log(`Test draws: ${testDraws.length}, Historical draws: ${historicalDraws.length}`);

  if (testDraws.length === 0) {
    console.error('No test draws found for the specified year');
    process.exit(1);
  }

  if (historicalDraws.length === 0) {
    console.error('No historical draws found for analysis');
    process.exit(1);
  }

  // Select 5 random test draws from the specified year
  const allResults: TestResult[] = [];

  // Shuffle test draws and take first 5
  const shuffledTestDraws = [...testDraws].sort(() => Math.random() - 0.5);
  const selectedTestDraws = shuffledTestDraws.slice(0, Math.min(5, testDraws.length));

  console.log(`\nProcessing ${selectedTestDraws.length} randomly selected test draws with all combinations...`);
  for (let i = 0; i < selectedTestDraws.length; i++) {
    const testDraw = selectedTestDraws[i];
    const drawDate = testDraw.drawDate!;

    console.log(`\nProcessing draw ${i + 1}/${selectedTestDraws.length}: ${drawDate.toDateString()}`);

    // Get historical data up to this draw (excluding future draws)
    const historicalDataUpToDraw = drawRecords.filter(draw =>
      draw.drawDate && draw.drawDate < drawDate
    );

    // Get last draw numbers for follow-on analysis
    const lastDraw = historicalDataUpToDraw.length > 0
      ? historicalDataUpToDraw[historicalDataUpToDraw.length - 1]
      : null;
    const lastDrawNumbers = lastDraw
      ? [...lastDraw.winningNumbers, lastDraw.specialNumber]
      : undefined;

    // Test each combination type and suggestion algorithm with the selected generation algorithm
    const generationAlgorithm = GENERATION_ALGORITHMS[config.algorithm];

    if (!generationAlgorithm) {
      throw new Error(`Unknown algorithm: ${config.algorithm}`);
    }

    for (const combinationType of COMBINATION_TYPES) {
      for (const suggestionAlgorithm of SUGGESTION_ALGORITHMS) {
        // Get selected numbers based on suggestion algorithm
        const selectedNumbers = getNumbersByAlgorithm(
          suggestionAlgorithm,
          historicalDataUpToDraw,
          lastDrawNumbers
        );

        // Generate combinations using generation algorithm
        const generatedCombinations = generateCombinations(
          combinationType,
          selectedNumbers,
          historicalDataUpToDraw,
          generationAlgorithm,
          lastDrawNumbers
        );

        // Calculate prize results for all combinations
        const prizeResults = calculatePrizeResults(generatedCombinations, testDraw);

        const result: TestResult = {
          drawDate,
          combinationType: combinationType.name,
          suggestionAlgorithm: suggestionAlgorithm.name,
          generationAlgorithm: generationAlgorithm.name,
          selectedNumbers,
          generatedCombinations,
          actualDraw: testDraw,
          prizeResults
        };

        allResults.push(result);
      }
    }
  }

  // Generate summary statistics
  console.log('\n' + '=' .repeat(80));
  console.log('GENERATING SUMMARY STATISTICS');
  console.log('=' .repeat(80));

  const summaryStats: SummaryStats[] = [];

  for (const combinationType of COMBINATION_TYPES) {
    for (const suggestionAlgorithm of SUGGESTION_ALGORITHMS) {
      const relevantResults = allResults.filter((r: TestResult) =>
        r.combinationType === combinationType.name &&
        r.suggestionAlgorithm === suggestionAlgorithm.name
      );

      if (relevantResults.length === 0) continue;

      let totalCombinations = 0;
      const prizeDistribution = {
        firstPrize: 0,
        secondPrize: 0,
        thirdPrize: 0,
        fourthPrize: 0,
        fifthPrize: 0,
        sixthPrize: 0,
        seventhPrize: 0
      };
      let totalPrizeAmount = 0;

      for (const result of relevantResults) {
        const prizeResult = result.prizeResults;
        totalCombinations += prizeResult.totalCombinations;
        prizeDistribution.firstPrize += prizeResult.firstPrize;
        prizeDistribution.secondPrize += prizeResult.secondPrize;
        prizeDistribution.thirdPrize += prizeResult.thirdPrize;
        prizeDistribution.fourthPrize += prizeResult.fourthPrize;
        prizeDistribution.fifthPrize += prizeResult.fifthPrize;
        prizeDistribution.sixthPrize += prizeResult.sixthPrize;
        prizeDistribution.seventhPrize += prizeResult.seventhPrize;
        totalPrizeAmount += prizeResult.totalPrize;
      }

      const totalPrizes = prizeDistribution.firstPrize + prizeDistribution.secondPrize +
                         prizeDistribution.thirdPrize + prizeDistribution.fourthPrize +
                         prizeDistribution.fifthPrize + prizeDistribution.sixthPrize +
                         prizeDistribution.seventhPrize;

      const hitRate = (totalPrizes / totalCombinations) * 100;
      const averagePrizePerCombination = totalPrizeAmount / totalCombinations;

      summaryStats.push({
        combinationType: combinationType.name,
        suggestionAlgorithm: suggestionAlgorithm.name,
        generationAlgorithm: config.algorithm,
        totalDraws: relevantResults.length,
        totalCombinations,
        prizeDistribution,
        totalPrizeAmount,
        averagePrizePerCombination,
        hitRate
      });
    }
  }

  // Display summary
  console.log('\nSUMMARY RESULTS - PRIZE DISTRIBUTION');
  console.log('=' .repeat(80));

  for (const stats of summaryStats) {
    console.log(`\n${stats.combinationType} - ${stats.suggestionAlgorithm} + ${stats.generationAlgorithm}`);
    console.log(`  Total Draws: ${stats.totalDraws}`);
    console.log(`  Total Combinations: ${stats.totalCombinations}`);
    console.log(`  Hit Rate: ${stats.hitRate.toFixed(2)}%`);
    console.log(`  Total Prize Amount: HK$${stats.totalPrizeAmount.toLocaleString()}`);
    console.log(`  Average Prize per Combination: HK$${stats.averagePrizePerCombination.toFixed(2)}`);
    console.log('  Prize Distribution:');
    console.log(`    First Prize: ${stats.prizeDistribution.firstPrize}`);
    console.log(`    Second Prize: ${stats.prizeDistribution.secondPrize}`);
    console.log(`    Third Prize: ${stats.prizeDistribution.thirdPrize}`);
    console.log(`    Fourth Prize: ${stats.prizeDistribution.fourthPrize} (HK$9,600 each)`);
    console.log(`    Fifth Prize: ${stats.prizeDistribution.fifthPrize} (HK$640 each)`);
    console.log(`    Sixth Prize: ${stats.prizeDistribution.sixthPrize} (HK$320 each)`);
    console.log(`    Seventh Prize: ${stats.prizeDistribution.seventhPrize} (HK$40 each)`);
  }

  // Find best performing combinations by total prize amount
  console.log('\n' + '=' .repeat(80));
  console.log('TOP PERFORMING COMBINATIONS BY TOTAL PRIZE');
  console.log('=' .repeat(80));

  const sortedByPrize = [...summaryStats].sort((a, b) => b.totalPrizeAmount - a.totalPrizeAmount);

  console.log('\nTop 10 by Total Prize Amount:');
  for (let i = 0; i < Math.min(10, sortedByPrize.length); i++) {
    const stat = sortedByPrize[i];
    console.log(`${i + 1}. ${stat.combinationType} - ${stat.suggestionAlgorithm} + ${stat.generationAlgorithm}: HK$${stat.totalPrizeAmount.toLocaleString()}`);
  }

  // Find best performing combinations by hit rate
  console.log('\n' + '=' .repeat(80));
  console.log('TOP PERFORMING COMBINATIONS BY HIT RATE');
  console.log('=' .repeat(80));

  const sortedByHitRate = [...summaryStats].sort((a, b) => b.hitRate - a.hitRate);

  console.log('\nTop 10 by Hit Rate:');
  for (let i = 0; i < Math.min(10, sortedByHitRate.length); i++) {
    const stat = sortedByHitRate[i];
    console.log(`${i + 1}. ${stat.combinationType} - ${stat.suggestionAlgorithm} + ${stat.generationAlgorithm}: ${stat.hitRate.toFixed(2)}%`);
  }

  // Write detailed results to log file
  await writeResultsToFile(config, allResults, summaryStats);

  console.log('\nTest completed successfully!');
}

/**
 * Prompt user for input
 */
async function prompt(question: string): Promise<string> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Main function with interactive prompts
 */
async function main() {
  console.log('=== Mark Six Algorithm Testing Program ===\n');

  // Prompt for test year
  let testYear: number;
  while (true) {
    const yearInput = await prompt('Enter test year (2000-2100): ');
    testYear = parseInt(yearInput);

    if (!isNaN(testYear) && testYear >= 2000 && testYear <= 2100) {
      break;
    }
    console.log('Please enter a valid year between 2000 and 2100');
  }

  // Prompt for algorithm selection
  let algorithm: 'classic' | 'classic_optimized' | 'follow_on' | 'ensemble' | 'bayesian' | 'advanced_follow_on';
  while (true) {
    console.log('\nAvailable algorithms:');
    console.log('1. Classic (V1) - Statistical analysis with frequency factors');
    console.log('2. Classic Optimized - Performance-optimized version of Classic');
    console.log('3. Follow-on (V2) - Pattern-based consecutive draw analysis');
    console.log('4. Ensemble - Combined approach with dynamic weighting');
    console.log('5. Bayesian - Probability-based model with evidence updating');
    console.log('6. Advanced Follow-on - Multi-step chains with conditional probabilities');

    const algoInput = await prompt('\nSelect algorithm (1-6): ');

    switch (algoInput.trim()) {
      case '1':
        algorithm = 'classic';
        break;
      case '2':
        algorithm = 'classic_optimized';
        break;
      case '3':
        algorithm = 'follow_on';
        break;
      case '4':
        algorithm = 'ensemble';
        break;
      case '5':
        algorithm = 'bayesian';
        break;
      case '6':
        algorithm = 'advanced_follow_on';
        break;
      default:
        console.log('Please enter 1, 2, 3, 4, 5, or 6');
        continue;
    }
    break;
  }

  // Optional: Prompt for years of history
  let yearsOfHistory = 3;
  const historyInput = await prompt(`\nEnter years of history to analyze (default: 3): `);
  if (historyInput.trim()) {
    const parsedHistory = parseInt(historyInput);
    if (!isNaN(parsedHistory) && parsedHistory > 0 && parsedHistory <= 10) {
      yearsOfHistory = parsedHistory;
    }
  }

  console.log(`\nStarting test with:`);
  console.log(`- Test Year: ${testYear}`);
  console.log(`- Algorithm: ${algorithm}`);
  console.log(`- Years of History: ${yearsOfHistory}`);
  console.log('=' .repeat(40));

  const config: TestConfig = {
    testYear,
    yearsOfHistory,
    algorithm
  };

  try {
    await runTest(config);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the program
if (require.main === module) {
  main();
}

/**
 * Write summary results to log file
 */
async function writeResultsToFile(config: TestConfig, allResults: TestResult[], summaryStats: SummaryStats[]): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  // Create logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-results-${config.testYear}-${timestamp}.txt`;
  const filepath = path.join(logsDir, filename);

  // Create summary text content
  let summaryText = `MARK SIX ALGORITHM TEST RESULTS - ${config.testYear}\n`;
  summaryText += '='.repeat(60) + '\n\n';

  summaryText += `Test Configuration:\n`;
  summaryText += `- Test Year: ${config.testYear}\n`;
  summaryText += `- Years of History: ${config.yearsOfHistory}\n`;
  summaryText += `- Total Test Draws: ${allResults.length > 0 ? Math.max(...allResults.map(r => r.drawDate.getTime())) : 0}\n`;
  summaryText += `- Total Combinations Tested: ${summaryStats.reduce((sum, stat) => sum + stat.totalCombinations, 0)}\n`;
  summaryText += `- Total Prize Amount: HK$${summaryStats.reduce((sum, stat) => sum + stat.totalPrizeAmount, 0).toLocaleString()}\n\n`;

  summaryText += 'SUMMARY RESULTS - PRIZE DISTRIBUTION\n';
  summaryText += '='.repeat(60) + '\n\n';

  for (const stats of summaryStats) {
    summaryText += `${stats.combinationType} - ${stats.suggestionAlgorithm} + ${stats.generationAlgorithm}\n`;
    summaryText += `  Total Draws: ${stats.totalDraws}\n`;
    summaryText += `  Total Combinations: ${stats.totalCombinations}\n`;
    summaryText += `  Hit Rate: ${stats.hitRate.toFixed(2)}%\n`;
    summaryText += `  Total Prize Amount: HK$${stats.totalPrizeAmount.toLocaleString()}\n`;
    summaryText += `  Average Prize per Combination: HK$${stats.averagePrizePerCombination.toFixed(2)}\n`;
    summaryText += '  Prize Distribution:\n';
    summaryText += `    First Prize: ${stats.prizeDistribution.firstPrize}\n`;
    summaryText += `    Second Prize: ${stats.prizeDistribution.secondPrize}\n`;
    summaryText += `    Third Prize: ${stats.prizeDistribution.thirdPrize}\n`;
    summaryText += `    Fourth Prize: ${stats.prizeDistribution.fourthPrize} (HK$9,600 each)\n`;
    summaryText += `    Fifth Prize: ${stats.prizeDistribution.fifthPrize} (HK$640 each)\n`;
    summaryText += `    Sixth Prize: ${stats.prizeDistribution.sixthPrize} (HK$320 each)\n`;
    summaryText += `    Seventh Prize: ${stats.prizeDistribution.seventhPrize} (HK$40 each)\n\n`;
  }

  // Add top performing combinations
  const sortedByPrize = [...summaryStats].sort((a, b) => b.totalPrizeAmount - a.totalPrizeAmount);
  const sortedByHitRate = [...summaryStats].sort((a, b) => b.hitRate - a.hitRate);

  summaryText += 'TOP PERFORMING COMBINATIONS BY TOTAL PRIZE\n';
  summaryText += '='.repeat(60) + '\n\n';

  summaryText += 'Top 10 by Total Prize Amount:\n';
  for (let i = 0; i < Math.min(10, sortedByPrize.length); i++) {
    const stat = sortedByPrize[i];
    summaryText += `${i + 1}. ${stat.combinationType} - ${stat.suggestionAlgorithm} + ${stat.generationAlgorithm}: HK$${stat.totalPrizeAmount.toLocaleString()}\n`;
  }

  summaryText += '\nTOP PERFORMING COMBINATIONS BY HIT RATE\n';
  summaryText += '='.repeat(60) + '\n\n';

  summaryText += 'Top 10 by Hit Rate:\n';
  for (let i = 0; i < Math.min(10, sortedByHitRate.length); i++) {
    const stat = sortedByHitRate[i];
    summaryText += `${i + 1}. ${stat.combinationType} - ${stat.suggestionAlgorithm} + ${stat.generationAlgorithm}: ${stat.hitRate.toFixed(2)}%\n`;
  }

  fs.writeFileSync(filepath, summaryText);
  console.log(`\nSummary results written to: ${filepath}`);
}

export { runTest };