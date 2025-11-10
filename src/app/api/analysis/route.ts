import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getFollowOnNumbers,
  getHistoricalFrequency,
  generateRandomNumbers,
  generateBalancedNumbers
} from '@/lib/algorithms';

/**
 * Get historical draws within the specified time period
 */
async function getHistoricalDraws(daysOfHistory: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOfHistory);

  return await prisma.markSixResult.findMany({
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
}

/**
 * GET /api/analysis - Get number frequency and pattern analysis
 * Query parameters:
 * - type: 'hot', 'cold', 'follow_on', 'random', 'balanced'
 * - daysOfHistory: days of history to analyze (default: 1095)
 * - testData: JSON array of historical draw records for testing (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('type') || 'hot';
    const daysOfHistory = parseInt(searchParams.get('daysOfHistory') || '1095');

    let result;

    switch (analysisType) {
      case 'follow_on':
        // Query database for historical data
        const historicalDraws = await getHistoricalDraws(daysOfHistory);
        result = getFollowOnNumbers(historicalDraws);
        break;
      case 'hot':
        // Query database for historical data
        const hotHistoricalDraws = await getHistoricalDraws(daysOfHistory);
        result = getHistoricalFrequency(hotHistoricalDraws, 'hot');
        break;
      case 'cold':
        // Query database for historical data
        const coldHistoricalDraws = await getHistoricalDraws(daysOfHistory);
        result = getHistoricalFrequency(coldHistoricalDraws, 'cold');
        break;
      case 'random':
        result = generateRandomNumbers();
        break;
      case 'balanced':
        result = generateBalancedNumbers();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid analysis type. Use: follow_on, hot, cold, random, or balanced' },
          { status: 400 }
        );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in GET /api/analysis:', error);
    return NextResponse.json({ error: 'Failed to perform analysis' }, { status: 500 });
  }
}