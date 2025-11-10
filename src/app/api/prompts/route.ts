import { NextRequest, NextResponse } from 'next/server';
import {
  generateLLMPrompt,
  generateQiMenLLMPrompt
} from '@/lib/generation-algorithms';

interface GeneratePromptRequest {
  combinationCount: number;
  selectedNumbers?: number[];
  luckyNumber: number;
  isDouble?: boolean;
  language?: string;
  promptType?: 'standard' | 'qimen';
}

/**
 * POST /api/prompts - Generate AI prompts for number generation
 * Body parameters:
 * - combinationCount: number of combinations to generate
 * - selectedNumbers: array of user-selected numbers
 * - luckyNumber: lucky number to include in every combination
 * - isDouble: whether to generate double combinations (7 numbers)
 * - language: language for the prompt ('en' or 'zh-TW')
 * - promptType: 'standard' or 'qimen'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GeneratePromptRequest;
    const {
      combinationCount,
      selectedNumbers = [],
      luckyNumber,
      isDouble = false,
      language = 'en',
      promptType = 'standard'
    } = body;

    // Validate required parameters
    if (!combinationCount || !luckyNumber) {
      return NextResponse.json(
        { error: 'Missing required parameters: combinationCount, luckyNumber' },
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

    // Validate language
    if (!['en', 'zh-TW'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language. Use: en or zh-TW' },
        { status: 400 }
      );
    }

    // Validate prompt type
    if (!['standard', 'qimen'].includes(promptType)) {
      return NextResponse.json(
        { error: 'Invalid prompt type. Use: standard or qimen' },
        { status: 400 }
      );
    }

    // Generate prompt based on type
    let prompt: string;

    if (promptType === 'standard') {
      prompt = await generateLLMPrompt(
        combinationCount,
        selectedNumbers,
        luckyNumber,
        isDouble,
        language
      );
    } else {
      prompt = await generateQiMenLLMPrompt(
        combinationCount,
        selectedNumbers,
        luckyNumber,
        isDouble,
        language
      );
    }

    return NextResponse.json({
      message: 'AI prompt generated successfully',
      prompt,
      promptType,
      language,
      combinationCount,
      selectedNumbers,
      luckyNumber,
      isDouble
    });

  } catch (error) {
    console.error('Error in POST /api/prompts:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI prompt' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/prompts - Get information about available prompt types
 * Query parameters: none
 */
export async function GET() {
  try {
    const promptTypes = [
      {
        type: 'standard',
        name: 'Standard AI Prompt',
        description: 'Generates prompts based on statistical analysis and historical patterns',
        supportedLanguages: ['en', 'zh-TW']
      },
      {
        type: 'qimen',
        name: 'Qi Men Dun Jia Prompt',
        description: 'Generates prompts based on Chinese metaphysical Qi Men Dun Jia principles',
        supportedLanguages: ['en', 'zh-TW']
      }
    ];

    return NextResponse.json({
      message: 'Available prompt types',
      promptTypes
    });
  } catch (error) {
    console.error('Error in GET /api/prompts:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve prompt information' },
      { status: 500 }
    );
  }
}