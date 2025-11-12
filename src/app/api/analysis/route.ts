import {
  generateBalancedNumbers,
  generateRandomNumbers,
  getAdvancedFollowOnNumbers,
  getHistoricalFrequency
} from '@/lib/algorithms';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get historical draws within the specified time period with caching
 */
const getHistoricalDraws = unstable_cache(
  async (daysOfHistory: number, currentDate: string) => {
    console.log(`[CACHE MISS] Fetching historical draws for ${daysOfHistory} days from ${currentDate}`);
    const cutoffDate = new Date(currentDate);
    cutoffDate.setDate(cutoffDate.getDate() - daysOfHistory);

    const result = await prisma.markSixResult.findMany({
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

    console.log(`[DB QUERY] Retrieved ${result.length} historical draws`);
    return result;
  },
  ['historical-draws'],
  { revalidate: 86400 } // 1 day cache
);

/**
 * Generate analysis results with caching (only for data-dependent analysis types)
 */
const generateCachedAnalysisResult = unstable_cache(
  async (analysisType: string, daysOfHistory: number, currentDate: string) => {
    console.log(`[CACHE MISS] Generating cached analysis for type: ${analysisType}, days: ${daysOfHistory}, date: ${currentDate}`);

    let result;

    switch (analysisType) {
      case 'follow_on':
        const advancedHistoricalDraws = await getHistoricalDraws(daysOfHistory, currentDate);
        result = getAdvancedFollowOnNumbers(advancedHistoricalDraws);
        break;
      case 'hot':
        const hotHistoricalDraws = await getHistoricalDraws(daysOfHistory, currentDate);
        result = getHistoricalFrequency(hotHistoricalDraws, 'hot');
        break;
      case 'cold':
        const coldHistoricalDraws = await getHistoricalDraws(daysOfHistory, currentDate);
        result = getHistoricalFrequency(coldHistoricalDraws, 'cold');
        break;
      default:
        throw new Error('Invalid analysis type');
    }

    console.log(`[ANALYSIS COMPLETE] Generated ${analysisType} analysis`);
    return result;
  },
  ['analysis-results'],
  { revalidate: 86400 } // 1 day cache
);

/**
 * Generate non-cached analysis results (for random and balanced types)
 */
async function generateNonCachedAnalysisResult(analysisType: string) {
  console.log(`[NON-CACHED] Generating ${analysisType} analysis`);

  let result;

  switch (analysisType) {
    case 'random':
      result = generateRandomNumbers();
      break;
    case 'balanced':
      result = generateBalancedNumbers();
      break;
    default:
      throw new Error('Invalid analysis type');
  }

  console.log(`[ANALYSIS COMPLETE] Generated ${analysisType} analysis`);
  return result;
}

/**
 * GET /api/analysis - Get number frequency and pattern analysis
 * Query parameters:
 * - type: 'hot', 'cold', 'follow_on', 'advanced_follow_on', 'random', 'balanced'
 * - daysOfHistory: days of history to analyze (default: 1095)
 * - testData: JSON array of historical draw records for testing (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('type') || 'hot';
    const daysOfHistory = parseInt(searchParams.get('daysOfHistory') || '1095');

    // Use current date as parameter for cache key
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`[API REQUEST] analysisType: ${analysisType}, daysOfHistory: ${daysOfHistory}, currentDate: ${currentDate}`);

    let result;

    // Only cache data-dependent analysis types (follow_on, advanced_follow_on, hot, cold)
    if (['follow_on', 'advanced_follow_on', 'hot', 'cold'].includes(analysisType)) {
      result = await generateCachedAnalysisResult(analysisType, daysOfHistory, currentDate);
    } else if (['random', 'balanced'].includes(analysisType)) {
      // Don't cache random and balanced types as they generate different results each time
      result = await generateNonCachedAnalysisResult(analysisType);
    } else {
      return NextResponse.json(
        { error: 'Invalid analysis type. Use: follow_on, advanced_follow_on, hot, cold, random, or balanced' },
        { status: 400 }
      );
    }

    console.log(`[API RESPONSE] Returning ${analysisType} analysis result`);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in GET /api/analysis:', error);
    return NextResponse.json({ error: 'Failed to perform analysis' }, { status: 500 });
  }
}