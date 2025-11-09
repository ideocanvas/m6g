import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

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
      case 'hot':
        result = await getHotNumbers(drawCount);
        break;
      case 'cold':
        result = await getColdNumbers(drawCount);
        break;
      case 'follow_on':
        result = await getFollowOnNumbers(daysOfHistory);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid analysis type. Use: hot, cold, or follow_on' },
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
 * Get hot numbers (most frequent in recent draws)
 */
async function getHotNumbers(drawCount: number): Promise<Array<{ number: number; frequency: number }>> {
  // Get recent draws
  const supabase = getSupabaseClient();
  const { data: recentDraws, error } = await supabase
    .from('mark6_results')
    .select('winning_numbers, special_number')
    .order('draw_date', { ascending: false })
    .limit(drawCount);

  if (error) {
    throw new Error(`Failed to fetch recent draws: ${error.message}`);
  }

  // Count frequency of each number
  const frequencyMap = new Map<number, number>();
  
  for (const draw of recentDraws) {
    // Count winning numbers
    for (const num of draw.winning_numbers) {
      frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
    }
    // Count special number
    frequencyMap.set(draw.special_number, (frequencyMap.get(draw.special_number) || 0) + 1);
  }

  // Convert to array and sort by frequency (descending)
  const frequencyArray = Array.from(frequencyMap.entries())
    .map(([number, frequency]) => ({ number, frequency }))
    .sort((a, b) => b.frequency - a.frequency);

  return frequencyArray;
}

/**
 * Get cold numbers (least frequent in recent draws)
 */
async function getColdNumbers(drawCount: number): Promise<Array<{ number: number; frequency: number }>> {
  const hotNumbers = await getHotNumbers(drawCount);
  
  // For cold numbers, we want the least frequent
  // First, ensure all numbers 1-49 are included with frequency 0 if missing
  const allNumbers = new Map<number, number>();
  for (let i = 1; i <= 49; i++) {
    allNumbers.set(i, 0);
  }
  
  // Update with actual frequencies
  for (const { number, frequency } of hotNumbers) {
    allNumbers.set(number, frequency);
  }
  
  // Convert to array and sort by frequency (ascending)
  const coldNumbers = Array.from(allNumbers.entries())
    .map(([number, frequency]) => ({ number, frequency }))
    .sort((a, b) => a.frequency - b.frequency);

  return coldNumbers;
}

/**
 * Get follow-on numbers based on historical patterns
 */
async function getFollowOnNumbers(daysOfHistory: number): Promise<Array<{ number: number; weight: number }>> {
  // Get draws within the specified time period
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOfHistory);

  const supabase = getSupabaseClient();
  const { data: historicalDraws, error } = await supabase
    .from('mark6_results')
    .select('draw_date, winning_numbers, special_number')
    .gte('draw_date', cutoffDate.toISOString())
    .order('draw_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch historical draws: ${error.message}`);
  }

  // Get the most recent draw
  const { data: recentDraws } = await supabase
    .from('mark6_results')
    .select('winning_numbers, special_number')
    .order('draw_date', { ascending: false })
    .limit(1);

  if (!recentDraws || recentDraws.length === 0) {
    throw new Error('No recent draw found');
  }

  const lastDrawNumbers = [
    ...recentDraws[0].winning_numbers,
    recentDraws[0].special_number
  ];

  // Analyze follow-on patterns
  const followOnMap = new Map<number, Map<number, number>>();

  for (let i = 0; i < historicalDraws.length - 1; i++) {
    const currentDraw = historicalDraws[i];
    const nextDraw = historicalDraws[i + 1];

    const currentNumbers = [
      ...currentDraw.winning_numbers,
      currentDraw.special_number
    ];

    const nextNumbers = [
      ...nextDraw.winning_numbers,
      nextDraw.special_number
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