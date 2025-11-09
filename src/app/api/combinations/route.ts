import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface GenerateCombinationRequest {
  generationId: string;
  combinationCount: number;
  selectedNumbers?: number[];
  luckyNumber: number;
  isDouble?: boolean;
  generationMethod?: 'v1' | 'v2' | 'ai' | 'qimen';
}


/**
 * GET /api/combinations - Get generated combinations
 * Query parameters:
 * - generationId: specific generation ID to fetch
 * - limit: number of results to return (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('generationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const data = await prisma.markSixGeneratedCombination.findMany({
      where: generationId ? { generationId } : {},
      orderBy: { generatedAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in GET /api/combinations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/combinations - Generate new number combinations
 * Body parameters:
 * - generationId: unique generation ID
 * - combinationCount: number of combinations to generate
 * - selectedNumbers: array of user-selected numbers
 * - luckyNumber: lucky number to include in every combination
 * - isDouble: whether to generate double combinations (7 numbers)
 * - generationMethod: 'v1', 'v2', 'ai', 'qimen'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateCombinationRequest;
    const {
      generationId,
      combinationCount,
      selectedNumbers = [],
      luckyNumber,
      isDouble = false,
      generationMethod = 'v2'
    } = body;

    // Validate required parameters
    if (!generationId || !combinationCount || !luckyNumber) {
      return NextResponse.json(
        { error: 'Missing required parameters: generationId, combinationCount, luckyNumber' },
        { status: 400 }
      );
    }

    // Validate numbers
    if (luckyNumber < 1 || luckyNumber > 49) {
      return NextResponse.json(
        { error: 'Lucky number must be between 1 and 49' },
        { status: 400 }
      );
    }

    if (selectedNumbers.some((num: number) => num < 1 || num > 49)) {
      return NextResponse.json(
        { error: 'All selected numbers must be between 1 and 49' },
        { status: 400 }
      );
    }

    // Generate combinations based on the selected method
    let combinations: number[][];
    
    switch (generationMethod) {
      case 'v1':
        combinations = await generateV1Combinations(combinationCount, selectedNumbers, luckyNumber, isDouble);
        break;
      case 'v2':
        combinations = await generateV2Combinations(combinationCount, selectedNumbers, luckyNumber, isDouble);
        break;
      case 'ai':
        combinations = await generateAICombinations(combinationCount, selectedNumbers, luckyNumber, isDouble);
        break;
      case 'qimen':
        combinations = await generateQiMenCombinations(combinationCount, selectedNumbers, luckyNumber, isDouble);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid generation method. Use: v1, v2, ai, or qimen' },
          { status: 400 }
        );
    }

    // Save combinations to database
    const savedCombinations = [];
    for (let i = 0; i < combinations.length; i++) {
      const combination = combinations[i];
      
      const combinationData = {
        generationId: generationId,
        sequenceNumber: i + 1,
        combinationNumbers: combination,
        isDouble: isDouble,
        generationMethod: generationMethod,
        selectedNumbers: selectedNumbers,
        luckyNumber: luckyNumber,
        combinationCount: combinationCount,
        generatedAt: new Date(),
        createdAt: new Date()
      };

      try {
        const data = await prisma.markSixGeneratedCombination.create({
          data: combinationData
        });
        savedCombinations.push(data);
      } catch (error) {
        console.error(`Error saving combination ${i + 1}:`, error);
      }
    }

    return NextResponse.json({
      message: `Successfully generated ${savedCombinations.length} combinations`,
      generationId,
      combinations: savedCombinations
    });

  } catch (error) {
    console.error('Error in POST /api/combinations:', error);
    return NextResponse.json(
      { error: 'Failed to generate combinations' },
      { status: 500 }
    );
  }
}

// Placeholder implementations for the generation algorithms
// These will be implemented in the next step

async function generateV1Combinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean
): Promise<number[][]> {
  // TODO: Implement V1 generation algorithm from reference code
  return generateRandomCombinations(combinationCount, selectedNumbers, luckyNumber, isDouble);
}

async function generateV2Combinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean
): Promise<number[][]> {
  // TODO: Implement V2 generation algorithm from reference code
  return generateRandomCombinations(combinationCount, selectedNumbers, luckyNumber, isDouble);
}

async function generateAICombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean
): Promise<number[][]> {
  // TODO: Implement AI generation algorithm from reference code
  return generateRandomCombinations(combinationCount, selectedNumbers, luckyNumber, isDouble);
}

async function generateQiMenCombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean
): Promise<number[][]> {
  // TODO: Implement Qi Men Dun Jia generation algorithm from reference code
  return generateRandomCombinations(combinationCount, selectedNumbers, luckyNumber, isDouble);
}

// Temporary fallback function
function generateRandomCombinations(
  combinationCount: number,
  selectedNumbers: number[],
  luckyNumber: number,
  isDouble: boolean
): number[][] {
  const combinations: number[][] = [];
  const combinationLength = isDouble ? 7 : 6;

  for (let i = 0; i < combinationCount; i++) {
    const combination = new Set<number>();
    
    // Always include lucky number
    combination.add(luckyNumber);

    // Include selected numbers if provided
    for (const num of selectedNumbers) {
      if (combination.size < combinationLength) {
        combination.add(num);
      }
    }

    // Fill remaining numbers randomly
    while (combination.size < combinationLength) {
      const randomNum = Math.floor(Math.random() * 49) + 1;
      combination.add(randomNum);
    }

    const sortedCombination = Array.from(combination).sort((a, b) => a - b);
    combinations.push(sortedCombination);
  }

  return combinations;
}