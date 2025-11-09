import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/analysis - Get number frequency and pattern analysis
 * Query parameters:
 * - type: 'hot', 'cold', 'follow_on'
 * - drawCount: number of draws to analyze (default: 100)
 * - daysOfHistory: days of history for follow-on analysis (default: 1095)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('type') || 'hot';
    const drawCount = parseInt(searchParams.get('drawCount') || '100');
    const daysOfHistory = parseInt(searchParams.get('daysOfHistory') || '1095');

    let result;

    switch (analysisType) {
      case 'follow_on':
        result = await getFollowOnNumbers(daysOfHistory);
        break;
      case 'hot':
        result = await getHistoricalFrequency(drawCount, 'hot');
        break;
      case 'cold':
        result = await getHistoricalFrequency(drawCount, 'cold');
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid analysis type. Use: follow_on, hot, or cold' },
          { status: 400 }
        );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in GET /api/analysis:', error);
    return NextResponse.json({ error: 'Failed to perform analysis' }, { status: 500 });
  }
}



/**
 * Get follow-on numbers based on historical patterns
 */
async function getFollowOnNumbers(daysOfHistory: number): Promise<Array<{ number: number; weight: number }>> {
  // Get draws within the specified time period
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

  // Get the most recent draw
  const recentDraws = await prisma.markSixResult.findMany({
    select: {
      winningNumbers: true,
      specialNumber: true
    },
    orderBy: { drawDate: 'desc' },
    take: 1
  });

  if (!recentDraws || recentDraws.length === 0) {
    throw new Error('No recent draw found');
  }

  const lastDrawNumbers = [
    ...recentDraws[0].winningNumbers,
    recentDraws[0].specialNumber
  ];

  // Analyze follow-on patterns
  const followOnMap = new Map<number, Map<number, number>>();

  for (let i = 0; i < historicalDraws.length - 1; i++) {
    const currentDraw = historicalDraws[i];
    const nextDraw = historicalDraws[i + 1];

    const currentNumbers = [
      ...currentDraw.winningNumbers,
      currentDraw.specialNumber
    ];

    const nextNumbers = [
      ...nextDraw.winningNumbers,
      nextDraw.specialNumber
    ];

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

  // Calculate weighted pool based on last draw numbers
  const weightedPool = new Map<number, number>();
  
  for (const num of lastDrawNumbers) {
    if (followOnMap.has(num)) {
      const followers = followOnMap.get(num)!;
      followers.forEach((count, followerNum) => {
        weightedPool.set(followerNum, (weightedPool.get(followerNum) || 0) + count);
      });
    }
  }

  // Convert to array and sort by weight (descending)
  const followOnNumbers = Array.from(weightedPool.entries())
    .map(([number, weight]) => ({ number, weight }))
    .sort((a, b) => b.weight - a.weight);

  return followOnNumbers;
}

/**
 * Get historical frequency analysis
 */
async function getHistoricalFrequency(drawCount: number, analysisType: 'hot' | 'cold'): Promise<Array<{ number: number; frequency: number }>> {
  // Get recent draws
  const recentDraws = await prisma.markSixResult.findMany({
    select: {
      winningNumbers: true,
      specialNumber: true
    },
    orderBy: { drawDate: 'desc' },
    take: drawCount
  });

  // Count frequency of each number
  const frequencyMap = new Map<number, number>();
  
  // Initialize all numbers 1-49 with frequency 0
  for (let i = 1; i <= 49; i++) {
    frequencyMap.set(i, 0);
  }
  
  for (const draw of recentDraws) {
    // Count winning numbers
    for (const num of draw.winningNumbers) {
      frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
    }
    // Count special number
    frequencyMap.set(draw.specialNumber, (frequencyMap.get(draw.specialNumber) || 0) + 1);
  }

  // Convert to array and sort based on analysis type
  const frequencyArray = Array.from(frequencyMap.entries())
    .map(([number, frequency]) => ({ number, frequency }));

  if (analysisType === 'hot') {
    frequencyArray.sort((a, b) => b.frequency - a.frequency);
  } else {
    frequencyArray.sort((a, b) => a.frequency - b.frequency);
  }

  return frequencyArray;
}