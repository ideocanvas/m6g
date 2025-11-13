
/**
 * Auto Test Strategies for Mark Six Algorithms
 *
 * This program tests ALL combinations of:
 * - Generation algorithms
 * - Suggestion algorithms
 * - Combination types
 *
 * It calculates costs and finds the top winning strategies
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Cached algorithm results to avoid redundant computations
 * - Parallel strategy testing using Promise.all
 * - Optimized historical data processing
 * - Reduced expensive operations
 */

import {
  generateAdvancedFollowOnCombinations,
  generateBalancedNumbers,
  generateBayesianCombinations,
  generateEnsembleCombinations,
  generateFollowOnCombinations,
  generateRandomNumbers,
  getAdvancedFollowOnNumbers,
  getFollowOnNumbers,
  getHistoricalFrequency
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

// Types for our auto test
interface CombinationType {
  name: string;
  combinationCount: number;
  isDouble: boolean;
  costPerDraw: number; // Cost in HKD for one draw
}

interface SuggestionAlgorithm {
  name: string;
  type: 'hot_follow_on' | 'advanced_follow_on' | 'hot' | 'cold' | 'random' | 'balanced';
}

interface GenerationAlgorithm {
  name: string;
  type: 'follow_on' | 'ensemble' | 'bayesian' | 'advanced_follow_on';
}

interface StrategyResult {
  generationAlgorithm: string;
  suggestionAlgorithm: string;
  combinationType: string;
  totalDraws: number;
  totalCost: number;
  totalPrize: number;
  netProfit: number;
  roi: number; // Return on Investment (percentage)
  hitRate: number; // Percentage of draws with any prize
  prizeDistribution: {
    firstPrize: number;
    secondPrize: number;
    thirdPrize: number;
    fourthPrize: number;
    fifthPrize: number;
    sixthPrize: number;
    seventhPrize: number;
  };
}

// Performance optimization: Cache for expensive operations
class AlgorithmCache {
  private static instance: AlgorithmCache;
  private frequencyCache = new Map<string, number[]>();
  private followOnCache = new Map<string, number[]>();
  private advancedFollowOnCache = new Map<string, number[]>();
  private historicalDataCache = new Map<string, unknown>();

  static getInstance(): AlgorithmCache {
    if (!AlgorithmCache.instance) {
      AlgorithmCache.instance = new AlgorithmCache();
    }
    return AlgorithmCache.instance;
  }

  getFrequencyNumbers(key: string, historicalDraws: DrawRecord[], type: 'hot' | 'cold'): number[] {
    const cacheKey = `${key}_${type}`;
    if (this.frequencyCache.has(cacheKey)) {
      return this.frequencyCache.get(cacheKey)!;
    }
    
    const results = getHistoricalFrequency(historicalDraws, type);
    const numbers = results.slice(0, 15).map(r => r.number);
    this.frequencyCache.set(cacheKey, numbers);
    return numbers;
  }

  getFollowOnNumbers(key: string, historicalDraws: DrawRecord[]): number[] {
    if (this.followOnCache.has(key)) {
      return this.followOnCache.get(key)!;
    }
    
    const results = getFollowOnNumbers(historicalDraws);
    const numbers = results.slice(0, 15).map(r => r.number);
    this.followOnCache.set(key, numbers);
    return numbers;
  }

  getAdvancedFollowOnNumbers(key: string, historicalDraws: DrawRecord[]): number[] {
    if (this.advancedFollowOnCache.has(key)) {
      return this.advancedFollowOnCache.get(key)!;
    }
    
    const results = getAdvancedFollowOnNumbers(historicalDraws);
    const numbers = results.slice(0, 15).map(r => r.number);
    this.advancedFollowOnCache.set(key, numbers);
    return numbers;
  }

  clear(): void {
    this.frequencyCache.clear();
    this.followOnCache.clear();
    this.advancedFollowOnCache.clear();
    this.historicalDataCache.clear();
  }
}

// Combination types with costs (based on Mark Six official pricing)
const COMBINATION_TYPES: CombinationType[] = [
  { name: '4x1', combinationCount: 4, isDouble: false, costPerDraw: 40 },
  { name: '4x2', combinationCount: 4, isDouble: true, costPerDraw: 80 },
  { name: '8x1', combinationCount: 8, isDouble: false, costPerDraw: 280 },
  { name: '8x2', combinationCount: 8, isDouble: true, costPerDraw: 560 },
  { name: '12x1', combinationCount: 12, isDouble: false, costPerDraw: 1320 },
  { name: '12x2', combinationCount: 12, isDouble: true, costPerDraw: 2640 },
  { name: '16x1', combinationCount: 16, isDouble: false, costPerDraw: 3360 },
  { name: '16x2', combinationCount: 16, isDouble: true, costPerDraw: 6720 },
  { name: '20x1', combinationCount: 20, isDouble: false, costPerDraw: 5700 },
  { name: '20x2', combinationCount: 20, isDouble: true, costPerDraw: 11400 },
  { name: '24x1', combinationCount: 24, isDouble: false, costPerDraw: 10120 },
  { name: '24x2', combinationCount: 24, isDouble: true, costPerDraw: 20240 },
  { name: '28x1', combinationCount: 28, isDouble: false, costPerDraw: 16380 },
  { name: '28x2', combinationCount: 28, isDouble: true, costPerDraw: 32760 },
  { name: '32x1', combinationCount: 32, isDouble: false, costPerDraw: 24800 },
  { name: '32x2', combinationCount: 32, isDouble: true, costPerDraw: 49600 },
];

// Mark Six Prize Categories
const PRIZE_CATEGORIES = [
  { name: 'First Prize', prizeAmount: 8000000 },
  { name: 'Second Prize', prizeAmount: 200000 },
  { name: 'Third Prize', prizeAmount: 50000 },
  { name: 'Fourth Prize', prizeAmount: 9600 },
  { name: 'Fifth Prize', prizeAmount: 640 },
  { name: 'Sixth Prize', prizeAmount: 320 },
  { name: 'Seventh Prize', prizeAmount: 40 }
];

// Suggestion algorithms to test
const SUGGESTION_ALGORITHMS: SuggestionAlgorithm[] = [
  { name: 'Hot Follow-on', type: 'hot_follow_on' },
  { name: 'Advanced Follow-on', type: 'advanced_follow_on' },
  { name: 'Hot Numbers', type: 'hot' },
  { name: 'Cold Numbers', type: 'cold' },
  { name: 'Random', type: 'random' },
  { name: 'Balanced', type: 'balanced' }
];

// Generation algorithms to test (Ensemble removed due to performance issues)
const GENERATION_ALGORITHMS: GenerationAlgorithm[] = [
  { name: 'Follow-on (V2)', type: 'follow_on' },
  { name: 'Advanced Follow-on', type: 'advanced_follow_on' },
  { name: 'Bayesian', type: 'bayesian' }
];


/**
 * Get numbers based on suggestion algorithm (OPTIMIZED WITH CACHING)
 */
function getNumbersByAlgorithm(
  algorithm: SuggestionAlgorithm,
  historicalDraws: DrawRecord[],
  lastDrawNumbers?: number[],
  cacheKey?: string
): number[] {
  const cache = AlgorithmCache.getInstance();
  const key = cacheKey || `${algorithm.type}_${historicalDraws.length}`;

  switch (algorithm.type) {
    case 'hot_follow_on':
      if (!lastDrawNumbers) {
        throw new Error('Last draw numbers required for hot follow-on algorithm');
      }
      return cache.getFollowOnNumbers(key, historicalDraws);

    case 'advanced_follow_on':
      return cache.getAdvancedFollowOnNumbers(key, historicalDraws);

    case 'hot':
      return cache.getFrequencyNumbers(key, historicalDraws, 'hot');

    case 'cold':
      return cache.getFrequencyNumbers(key, historicalDraws, 'cold');

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

  switch (generationAlgorithm.type) {
    case 'follow_on':
      const followOnResults = generateFollowOnCombinations(
        combinationType.combinationCount,
        selectedNumbers,
        luckyNumber,
        combinationType.isDouble,
        historicalDraws,
        lastDrawNumbers || []
      );
      return followOnResults.map(r => r.combination);

    case 'advanced_follow_on':
      const advancedResults = generateAdvancedFollowOnCombinations(
        combinationType.combinationCount,
        selectedNumbers,
        luckyNumber,
        combinationType.isDouble,
        historicalDraws
      );
      return advancedResults.map(r => r.combination);


    case 'bayesian':
      const bayesianResults = generateBayesianCombinations(
        combinationType.combinationCount,
        selectedNumbers,
        luckyNumber,
        combinationType.isDouble,
        historicalDraws,
        lastDrawNumbers
      );
      return bayesianResults.map(r => r.combination);

    default:
      throw new Error(`Unknown generation algorithm: ${generationAlgorithm.type}`);
  }
}

/**
 * Calculate prize for a combination against actual draw
 */
function calculatePrize(combination: number[], actualDraw: DrawRecord): { prizeCategory: string; prizeAmount: number } {
  let matchedWinning = 0;
  for (const num of combination) {
    if (actualDraw.winningNumbers.includes(num)) {
      matchedWinning++;
    }
  }

  const matchedSpecial = combination.includes(actualDraw.specialNumber);

  // Find matching prize category
  for (const category of PRIZE_CATEGORIES) {
    let matches = false;

    switch (category.name) {
      case 'First Prize':
        matches = matchedWinning === 6;
        break;
      case 'Second Prize':
        matches = matchedWinning === 5 && matchedSpecial;
        break;
      case 'Third Prize':
        matches = matchedWinning === 5 && !matchedSpecial;
        break;
      case 'Fourth Prize':
        matches = matchedWinning === 4 && matchedSpecial;
        break;
      case 'Fifth Prize':
        matches = matchedWinning === 4 && !matchedSpecial;
        break;
      case 'Sixth Prize':
        matches = matchedWinning === 3 && matchedSpecial;
        break;
      case 'Seventh Prize':
        matches = matchedWinning === 3 && !matchedSpecial;
        break;
    }

    if (matches) {
      return { prizeCategory: category.name, prizeAmount: category.prizeAmount };
    }
  }

  return { prizeCategory: 'No Prize', prizeAmount: 0 };
}

/**
 * Test a specific strategy combination (OPTIMIZED)
 */
function testStrategy(
  generationAlgorithm: GenerationAlgorithm,
  suggestionAlgorithm: SuggestionAlgorithm,
  combinationType: CombinationType,
  historicalDraws: DrawRecord[],
  testYear: number
): StrategyResult {
  const startTime = Date.now();
  console.log(`Testing: ${generationAlgorithm.name} + ${suggestionAlgorithm.name} + ${combinationType.name}`);

  const result: StrategyResult = {
    generationAlgorithm: generationAlgorithm.name,
    suggestionAlgorithm: suggestionAlgorithm.name,
    combinationType: combinationType.name,
    totalDraws: 0,
    totalCost: 0,
    totalPrize: 0,
    netProfit: 0,
    roi: 0,
    hitRate: 0,
    prizeDistribution: {
      firstPrize: 0,
      secondPrize: 0,
      thirdPrize: 0,
      fourthPrize: 0,
      fifthPrize: 0,
      sixthPrize: 0,
      seventhPrize: 0
    }
  };

  let winningDraws = 0;

  // Performance optimization: Pre-filter draws for the test year
  const testDraws = historicalDraws.filter((draw, index) => {
    if (index === 0) return false; // Skip first draw (no previous draw)
    const drawYear = draw.drawDate!.getFullYear();
    return drawYear === testYear;
  });

  // Performance optimization: Process draws in batches
  const batchSize = Math.ceil(testDraws.length / 10); // Process in 10 batches
  for (let batchStart = 0; batchStart < testDraws.length; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, testDraws.length);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const currentDraw = testDraws[i];
      const currentIndex = historicalDraws.indexOf(currentDraw);
      const previousDraw = historicalDraws[currentIndex - 1];
      const lastDrawNumbers = [...previousDraw.winningNumbers, previousDraw.specialNumber];

      try {
        // Performance optimization: Use cache key for consistent historical data
        const cacheKey = `${suggestionAlgorithm.type}_${currentIndex}`;
        const selectedNumbers = getNumbersByAlgorithm(
          suggestionAlgorithm,
          historicalDraws.slice(0, currentIndex),
          lastDrawNumbers,
          cacheKey
        );

        // Generate combinations
        const combinations = generateCombinations(
          combinationType,
          selectedNumbers,
          historicalDraws.slice(0, currentIndex),
          generationAlgorithm,
          lastDrawNumbers
        );

        // Calculate prize for this draw
        let drawPrize = 0;
        let hasWon = false;

        for (const combination of combinations) {
          const { prizeAmount, prizeCategory } = calculatePrize(combination, currentDraw);
          drawPrize += prizeAmount;

          if (prizeAmount > 0) {
            hasWon = true;
            // Update prize distribution
            switch (prizeCategory) {
              case 'First Prize': result.prizeDistribution.firstPrize++; break;
              case 'Second Prize': result.prizeDistribution.secondPrize++; break;
              case 'Third Prize': result.prizeDistribution.thirdPrize++; break;
              case 'Fourth Prize': result.prizeDistribution.fourthPrize++; break;
              case 'Fifth Prize': result.prizeDistribution.fifthPrize++; break;
              case 'Sixth Prize': result.prizeDistribution.sixthPrize++; break;
              case 'Seventh Prize': result.prizeDistribution.seventhPrize++; break;
            }
          }
        }

        result.totalDraws++;
        result.totalCost += combinationType.costPerDraw;
        result.totalPrize += drawPrize;

        if (hasWon) {
          winningDraws++;
        }

      } catch {
        // Skip draws that cause errors (e.g., insufficient historical data)
        continue;
      }
    }
  }

  // Calculate final metrics
  result.netProfit = result.totalPrize - result.totalCost;
  result.roi = result.totalCost > 0 ? (result.netProfit / result.totalCost) * 100 : 0;
  result.hitRate = result.totalDraws > 0 ? (winningDraws / result.totalDraws) * 100 : 0;

  const endTime = Date.now();
  console.log(`✅ Completed in ${endTime - startTime}ms: ${generationAlgorithm.name} + ${suggestionAlgorithm.name} + ${combinationType.name}`);

  return result;
}

/**
 * Sleep function to prevent blocking other system tasks
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main auto test function (OPTIMIZED WITH PARALLEL PROCESSING)
 */
async function runAutoTest() {
  const startTime = Date.now();
  console.log('🚀 Starting Auto Test Strategies for Mark Six Algorithms\n');
  console.log('⚡ PERFORMANCE OPTIMIZATIONS ENABLED: Caching + Parallel Processing\n');

  const historicalDraws = await getRealDrawData();
  const testYear = 2024; // Test on 2024 data

  console.log(`Testing on ${testYear} data with ${historicalDraws.length} total draws\n`);

  const allResults: StrategyResult[] = [];
  const totalStrategies = GENERATION_ALGORITHMS.length * SUGGESTION_ALGORITHMS.length * COMBINATION_TYPES.length;

  console.log(`📈 Testing ${totalStrategies} total strategies...\n`);

  // Performance optimization: Generate all strategy combinations first
  const strategyCombinations: Array<{
    generationAlgorithm: GenerationAlgorithm;
    suggestionAlgorithm: SuggestionAlgorithm;
    combinationType: CombinationType;
  }> = [];

  for (const generationAlgorithm of GENERATION_ALGORITHMS) {
    for (const suggestionAlgorithm of SUGGESTION_ALGORITHMS) {
      for (const combinationType of COMBINATION_TYPES) {
        strategyCombinations.push({
          generationAlgorithm,
          suggestionAlgorithm,
          combinationType
        });
      }
    }
  }

  // Performance optimization: Process strategies in parallel batches
  const BATCH_SIZE = 4; // Number of strategies to test in parallel
  let completedCount = 0;

  for (let batchStart = 0; batchStart < strategyCombinations.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, strategyCombinations.length);
    const batch = strategyCombinations.slice(batchStart, batchEnd);

    // Process batch in parallel
    const batchPromises = batch.map(async (strategy, index) => {
      const strategyIndex = batchStart + index;
      const progress = ((strategyIndex / totalStrategies) * 100).toFixed(1);
      
      console.log(`🔄 Progress: ${progress}% (${strategyIndex + 1}/${totalStrategies}) - Testing: ${strategy.generationAlgorithm.name} + ${strategy.suggestionAlgorithm.name} + ${strategy.combinationType.name}`);

      try {
        const result = await testStrategy(
          strategy.generationAlgorithm,
          strategy.suggestionAlgorithm,
          strategy.combinationType,
          historicalDraws,
          testYear
        );

        if (result.totalDraws > 0) {
          return result;
        }
      } catch (error) {
        console.error(`❌ Error testing ${strategy.generationAlgorithm.name} + ${strategy.suggestionAlgorithm.name} + ${strategy.combinationType.name}:`, error);
      }
      
      return null;
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Filter out null results and add to all results
    const validResults = batchResults.filter(result => result !== null) as StrategyResult[];
    allResults.push(...validResults);
    
    completedCount += batch.length;
    console.log(`✅ Batch completed: ${completedCount}/${totalStrategies} strategies processed`);
  }

  // Sort by ROI (descending)
  allResults.sort((a, b) => b.roi - a.roi);

  // Display top strategies
  console.log('\n🏆 TOP 10 WINNING STRATEGIES (by ROI):\n');
  console.log('='.repeat(120));
  console.log('Rank | Generation      | Suggestion      | Combo | Cost/Draw | Total Cost | Total Prize | Net Profit | ROI     | Hit Rate');
  console.log('='.repeat(120));

  allResults.slice(0, 10).forEach((result, index) => {
    const costPerDraw = result.totalCost / result.totalDraws;
    console.log(
      `${(index + 1).toString().padStart(4)} | ${result.generationAlgorithm.padEnd(15)} | ${result.suggestionAlgorithm.padEnd(15)} | ${result.combinationType.padEnd(5)} | $${costPerDraw} | $${result.totalCost.toLocaleString()} | $${result.totalPrize.toLocaleString()} | $${result.netProfit.toLocaleString()} | ${result.roi.toFixed(1)}% | ${result.hitRate.toFixed(1)}%`
    );
  });

  console.log('='.repeat(120));

  // Display summary statistics
  const totalTime = Date.now() - startTime;
  console.log('\n📊 SUMMARY STATISTICS:');
  console.log(`Total strategies tested: ${allResults.length}`);
  console.log(`Total combinations: ${GENERATION_ALGORITHMS.length} generation × ${SUGGESTION_ALGORITHMS.length} suggestion × ${COMBINATION_TYPES.length} combination = ${GENERATION_ALGORITHMS.length * SUGGESTION_ALGORITHMS.length * COMBINATION_TYPES.length}`);
  console.log(`Total execution time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)} seconds)`);
  console.log(`Average time per strategy: ${(totalTime / allResults.length).toFixed(0)}ms`);
  console.log(`Note: Classic algorithms removed from testing`);

  // Find best performing algorithms
  const bestByROI = allResults[0];
  const bestByHitRate = [...allResults].sort((a, b) => b.hitRate - a.hitRate)[0];
  const bestByNetProfit = [...allResults].sort((a, b) => b.netProfit - a.netProfit)[0];

  console.log('\n🎯 BEST PERFORMERS:');
  console.log(`Highest ROI: ${bestByROI.generationAlgorithm} + ${bestByROI.suggestionAlgorithm} + ${bestByROI.combinationType} (${bestByROI.roi.toFixed(1)}%)`);
  console.log(`Highest Hit Rate: ${bestByHitRate.generationAlgorithm} + ${bestByHitRate.suggestionAlgorithm} + ${bestByHitRate.combinationType} (${bestByHitRate.hitRate.toFixed(1)}%)`);
  console.log(`Highest Net Profit: ${bestByNetProfit.generationAlgorithm} + ${bestByNetProfit.suggestionAlgorithm} + ${bestByNetProfit.combinationType} ($${bestByNetProfit.netProfit.toLocaleString()})`);

  console.log('\n✅ Auto Test Strategies completed!');
}

// Run the auto test
runAutoTest().catch(console.error);