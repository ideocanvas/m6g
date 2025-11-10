#!/usr/bin/env tsx

/**
 * Test Program for Mark Six Algorithms
 * 
 * This program tests the algorithms in src/lib/algorithms against historical draw results.
 * It queries the database once for all required data and processes everything in memory.
 * 
 * Usage: pnpm tsx scripts/test-algorithms.ts [testYear]
 * Example: pnpm tsx scripts/test-algorithms.ts 2024
 */

import {
  getHistoricalFrequency,
  getFollowOnNumbers,
  generateRandomNumbers,
  generateBalancedNumbers,
  generateClassicCombinations,
  generateFollowOnCombinations
} from '../src/lib/algorithms';
import { DrawRecord } from '../src/lib/algorithms/types';

// Mock database function for testing
async function getMockDrawData(startDate: Date, endDate: Date): Promise<DrawRecord[]> {
  console.log('Using mock data for testing');
  
  // Generate mock draw data for testing
  const mockDraws: DrawRecord[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Generate draws approximately twice a week (Mark Six schedule)
    if (Math.random() < 0.3) { // 30% chance of having a draw on a given day
      const winningNumbers = generateUniqueNumbers(6, 1, 49);
      const specialNumber = generateUniqueNumbers(1, 1, 49, winningNumbers)[0];
      
      mockDraws.push({
        winningNumbers,
        specialNumber,
        drawDate: new Date(currentDate)
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return mockDraws;
}

function generateUniqueNumbers(count: number, min: number, max: number, exclude: number[] = []): number[] {
  const numbers: number[] = [];
  const availableNumbers = Array.from({ length: max - min + 1 }, (_, i) => i + min)
    .filter(n => !exclude.includes(n));
  
  for (let i = 0; i < count && availableNumbers.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    numbers.push(availableNumbers[randomIndex]);
    availableNumbers.splice(randomIndex, 1);
  }
  
  return numbers.sort((a, b) => a - b);
}

// Types for our test program
interface TestConfig {
  testYear: number;
  yearsOfHistory: number;
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

// Generation algorithms to test
const GENERATION_ALGORITHMS: GenerationAlgorithm[] = [
  { name: 'Classic (V1)', type: 'classic' },
  { name: 'Follow-on (V2)', type: 'follow_on' }
];

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
  suggestionAlgorithm: SuggestionAlgorithm,
  generationAlgorithm: GenerationAlgorithm,
  lastDrawNumbers?: number[]
): number[][] {
  // For this test, we'll use a random lucky number from selected numbers
  const luckyNumber = selectedNumbers.length > 0
    ? selectedNumbers[Math.floor(Math.random() * selectedNumbers.length)]
    : Math.floor(Math.random() * 49) + 1;

  try {
    if (generationAlgorithm.type === 'follow_on') {
      const results = generateFollowOnCombinations(
        combinationType.combinationCount,
        selectedNumbers,
        luckyNumber,
        combinationType.isDouble,
        historicalDraws,
        lastDrawNumbers || []
      );
      return results.map(r => r.combination);
    } else {
      const results = generateClassicCombinations(
        combinationType.combinationCount,
        selectedNumbers,
        luckyNumber,
        combinationType.isDouble,
        historicalDraws
      );
      return results.map(r => r.combination);
    }
  } catch (error) {
    console.warn(`Error generating combinations for ${suggestionAlgorithm.name} + ${generationAlgorithm.name}:`, error);
    // Fallback to basic generation
    return generateBasicCombinations(
      combinationType.combinationCount,
      selectedNumbers,
      luckyNumber,
      combinationType.isDouble
    );
  }
}

/**
 * Basic combination generation fallback
 */
function generateBasicCombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean
): number[][] {
  const combinations: number[][] = [];
  
  for (let i = 0; i < combinationCount; i++) {
    const combination = [luckyNumber];
    const numbersToPick = isDouble ? 6 : 5; // +1 for lucky number
    
    // Fill with selected numbers or random numbers
    const availableNumbers = selectedNumbers.length > 0 
      ? [...selectedNumbers].filter(n => n !== luckyNumber)
      : Array.from({ length: 49 }, (_, i) => i + 1).filter(n => n !== luckyNumber);
    
    // Shuffle available numbers
    const shuffled = [...availableNumbers].sort(() => Math.random() - 0.5);
    
    // Pick required numbers
    for (let j = 0; j < numbersToPick && j < shuffled.length; j++) {
      if (!combination.includes(shuffled[j])) {
        combination.push(shuffled[j]);
      }
    }
    
    // If we need more numbers (shouldn't happen with 15 selected numbers)
    while (combination.length < (isDouble ? 7 : 6)) {
      const randomNum = Math.floor(Math.random() * 49) + 1;
      if (!combination.includes(randomNum)) {
        combination.push(randomNum);
      }
    }
    
    combination.sort((a, b) => a - b);
    combinations.push(combination);
  }
  
  return combinations;
}

// Mark Six Prize Categories
const PRIZE_CATEGORIES: PrizeCategory[] = [
  {
    name: 'First Prize',
    description: '選中6個「攪出號碼」',
    matchCondition: (matchedWinning, matchedSpecial) => matchedWinning === 6,
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
  console.log('=' .repeat(80));
  
  // Calculate date range
  const testYearStart = new Date(config.testYear, 0, 1);
  const testYearEnd = new Date(config.testYear, 11, 31);
  const historyStart = new Date(config.testYear - config.yearsOfHistory, 0, 1);
  
  console.log(`Test period: ${testYearStart.toDateString()} to ${testYearEnd.toDateString()}`);
  console.log(`History period: ${historyStart.toDateString()} to ${testYearStart.toDateString()}`);
  
  // Get mock data for testing
  console.log('\nGenerating mock draw data for testing...');
  const drawRecords = await getMockDrawData(historyStart, testYearEnd);
  
  console.log(`Generated ${drawRecords.length} mock draw records`);
  
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
  
  // Process each test draw (limit to first 5 for faster testing with all combinations)
  const allResults: TestResult[] = [];
  const maxTestDraws = Math.min(5, testDraws.length);
  
  console.log(`\nProcessing first ${maxTestDraws} test draws with all combinations...`);
  for (let i = 0; i < maxTestDraws; i++) {
    const testDraw = testDraws[i];
    const drawDate = testDraw.drawDate!;
    
    console.log(`\nProcessing draw ${i + 1}/${maxTestDraws}: ${drawDate.toDateString()}`);
    
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
    
    // Test each combination type, suggestion algorithm, and generation algorithm
    for (const combinationType of COMBINATION_TYPES) {
      for (const suggestionAlgorithm of SUGGESTION_ALGORITHMS) {
        for (const generationAlgorithm of GENERATION_ALGORITHMS) {
          try {
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
              suggestionAlgorithm,
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
            
          } catch (error) {
            console.warn(`Error processing ${combinationType.name} with ${suggestionAlgorithm.name} + ${generationAlgorithm.name}:`, error);
          }
        }
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
      for (const generationAlgorithm of GENERATION_ALGORITHMS) {
        const relevantResults = allResults.filter(r =>
          r.combinationType === combinationType.name &&
          r.suggestionAlgorithm === suggestionAlgorithm.name &&
          r.generationAlgorithm === generationAlgorithm.name
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
          generationAlgorithm: generationAlgorithm.name,
          totalDraws: relevantResults.length,
          totalCombinations,
          prizeDistribution,
          totalPrizeAmount,
          averagePrizePerCombination,
          hitRate
        });
      }
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
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: pnpm tsx scripts/test-algorithms.ts [testYear]');
    console.log('Example: pnpm tsx scripts/test-algorithms.ts 2024');
    process.exit(1);
  }
  
  const testYear = parseInt(args[0]);
  
  if (isNaN(testYear) || testYear < 2000 || testYear > 2100) {
    console.error('Please provide a valid year between 2000 and 2100');
    process.exit(1);
  }
  
  const config: TestConfig = {
    testYear,
    yearsOfHistory: 3 // Test year + previous 3 years as requested
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
 * Write detailed results to log file
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
  const filename = `test-results-${config.testYear}-${timestamp}.json`;
  const filepath = path.join(logsDir, filename);
  
  const output = {
    config,
    summary: {
      totalTestDraws: allResults.length > 0 ? Math.max(...allResults.map(r => r.drawDate.getTime())) : 0,
      totalCombinations: summaryStats.reduce((sum, stat) => sum + stat.totalCombinations, 0),
      totalPrizeAmount: summaryStats.reduce((sum, stat) => sum + stat.totalPrizeAmount, 0),
      summaryStats
    },
    detailedResults: allResults.map(result => ({
      drawDate: result.drawDate.toISOString(),
      combinationType: result.combinationType,
      suggestionAlgorithm: result.suggestionAlgorithm,
      generationAlgorithm: result.generationAlgorithm,
      selectedNumbers: result.selectedNumbers,
      generatedCombinations: result.generatedCombinations,
      actualDraw: result.actualDraw,
      prizeResults: result.prizeResults
    }))
  };
  
  fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
  console.log(`\nDetailed results written to: ${filepath}`);
}

export { runTest };