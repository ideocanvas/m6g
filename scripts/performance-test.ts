#!/usr/bin/env tsx

/**
 * Performance Test for Classic Generation Algorithms
 *
 * Compares the original classic algorithm with the optimized version
 */

import { generateClassicCombinations } from '../src/lib/algorithms/generation/classic';
import { generateClassicCombinationsOptimized } from '../src/lib/algorithms/generation/classic-optimized';
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

/**
 * Run performance test for a single algorithm
 */
async function runPerformanceTest(
  algorithmName: string,
  algorithm: (
    combinationCount: number,
    selectedNumbers: number[],
    luckyNumber: number,
    isDouble: boolean,
    historicalDraws: DrawRecord[]
  ) => { combination: number[]; score?: number }[],
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean,
  historicalDraws: DrawRecord[],
  iterations: number = 5
): Promise<{
  algorithmName: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalCombinations: number;
  averageScore: number;
}> {
  console.log(`\nTesting ${algorithmName}...`);

  const times: number[] = [];
  const scores: number[] = [];
  let totalCombinations = 0;

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    const results = algorithm(
      combinationCount,
      selectedNumbers,
      luckyNumber,
      isDouble,
      historicalDraws
    );

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    times.push(executionTime);
    totalCombinations += results.length;

    // Calculate average score
    const avgScore = results.reduce((sum: number, result: { score?: number }) => sum + (result.score || 0), 0) / results.length;
    scores.push(avgScore);

    console.log(`  Iteration ${i + 1}: ${executionTime.toFixed(2)}ms, Score: ${avgScore.toFixed(2)}`);
  }

  const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return {
    algorithmName,
    averageTime,
    minTime,
    maxTime,
    totalCombinations: totalCombinations / iterations,
    averageScore
  };
}

/**
 * Main performance comparison function
 */
async function comparePerformance(): Promise<void> {
  console.log('=== Classic Generation Algorithm Performance Comparison ===\n');

  // Get test data
  const allDrawRecords = await getRealDrawData();

  // Use last 100 draws for testing
  const testDraws = allDrawRecords.slice(-100);
  console.log(`Using ${testDraws.length} historical draws for testing`);

  // Test configuration
  const testConfig = {
    combinationCount: 10,
    selectedNumbers: [7, 16, 26, 31, 47, 49, 12, 18, 23, 35, 42],
    luckyNumber: 7,
    isDouble: false,
    iterations: 5
  };

  console.log(`Test Configuration:`);
  console.log(`- Combination Count: ${testConfig.combinationCount}`);
  console.log(`- Selected Numbers: ${testConfig.selectedNumbers.length}`);
  console.log(`- Lucky Number: ${testConfig.luckyNumber}`);
  console.log(`- Double: ${testConfig.isDouble}`);
  console.log(`- Iterations: ${testConfig.iterations}`);

  // Run performance tests
  const results = [];

  // Test original algorithm
  results.push(await runPerformanceTest(
    'Original Classic',
    generateClassicCombinations,
    testConfig.combinationCount,
    testConfig.selectedNumbers,
    testConfig.luckyNumber,
    testConfig.isDouble,
    testDraws,
    testConfig.iterations
  ));

  // Test optimized algorithm
  results.push(await runPerformanceTest(
    'Optimized Classic',
    generateClassicCombinationsOptimized,
    testConfig.combinationCount,
    testConfig.selectedNumbers,
    testConfig.luckyNumber,
    testConfig.isDouble,
    testDraws,
    testConfig.iterations
  ));

  // Display comparison results
  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE COMPARISON RESULTS');
  console.log('='.repeat(80));

  for (const result of results) {
    console.log(`\n${result.algorithmName}:`);
    console.log(`  Average Time: ${result.averageTime.toFixed(2)}ms`);
    console.log(`  Min Time: ${result.minTime.toFixed(2)}ms`);
    console.log(`  Max Time: ${result.maxTime.toFixed(2)}ms`);
    console.log(`  Average Score: ${result.averageScore.toFixed(2)}`);
    console.log(`  Combinations per run: ${result.totalCombinations}`);
  }

  // Calculate performance improvement
  const originalTime = results[0].averageTime;
  const optimizedTime = results[1].averageTime;
  const improvement = ((originalTime - optimizedTime) / originalTime) * 100;

  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE SUMMARY');
  console.log('='.repeat(80));
  console.log(`Original Algorithm: ${originalTime.toFixed(2)}ms`);
  console.log(`Optimized Algorithm: ${optimizedTime.toFixed(2)}ms`);
  console.log(`Performance Improvement: ${improvement.toFixed(1)}% faster`);
  console.log(`Speedup Factor: ${(originalTime / optimizedTime).toFixed(2)}x`);

  // Quality comparison
  const originalScore = results[0].averageScore;
  const optimizedScore = results[1].averageScore;
  const scoreDifference = ((optimizedScore - originalScore) / originalScore) * 100;

  console.log(`\nQUALITY COMPARISON:`);
  console.log(`Original Score: ${originalScore.toFixed(2)}`);
  console.log(`Optimized Score: ${optimizedScore.toFixed(2)}`);
  console.log(`Score Difference: ${scoreDifference.toFixed(1)}%`);

  if (scoreDifference >= 0) {
    console.log('✅ Optimized algorithm maintains or improves quality');
  } else {
    console.log('⚠️  Optimized algorithm shows slight quality reduction');
  }
}

/**
 * Memory usage test
 */
async function testMemoryUsage(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('MEMORY USAGE TEST');
  console.log('='.repeat(80));

  const allDrawRecords = await getRealDrawData();
  const testDraws = allDrawRecords.slice(-50);

  // Test memory usage for both algorithms
  const memoryUsage = process.memoryUsage();
  console.log(`Initial Memory Usage:`);
  console.log(`  RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

  // Run both algorithms multiple times to measure memory impact
  for (let i = 0; i < 10; i++) {
    generateClassicCombinations(10, [7, 16, 26, 31, 47, 49], 7, false, testDraws);
    generateClassicCombinationsOptimized(10, [7, 16, 26, 31, 47, 49], 7, false, testDraws);
  }

  const finalMemoryUsage = process.memoryUsage();
  console.log(`\nFinal Memory Usage:`);
  console.log(`  RSS: ${(finalMemoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Total: ${(finalMemoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Used: ${(finalMemoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

  const memoryIncrease = finalMemoryUsage.heapUsed - memoryUsage.heapUsed;
  console.log(`\nMemory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
}

// Run the performance comparison
if (require.main === module) {
  comparePerformance()
    .then(() => testMemoryUsage())
    .catch(error => {
      console.error('Performance test failed:', error);
      process.exit(1);
    });
}

export { comparePerformance, testMemoryUsage };