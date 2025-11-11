import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  generateClassicCombinations,
  generateFollowOnCombinations,
  generateEnsembleCombinations,
  generateBayesianCombinations,
  generateClassicCombinationsOptimized,
} from "@/lib/algorithms";

interface GenerateCombinationRequest {
  generationId: string;
  combinationCount: number;
  selectedNumbers?: number[];
  luckyNumber: number;
  isDouble?: boolean;
  generationMethod?:
    | "classic"
    | "follow-on"
    | "ensemble"
    | "bayesian"
    | "classic-optimized";
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
    const generationId = searchParams.get("generationId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const data = await prisma.markSixGeneratedCombination.findMany({
      where: generationId ? { generationId } : {},
      orderBy: { generatedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unexpected error in GET /api/combinations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
 * - generationMethod: 'classic', 'follow-on', 'ensemble', 'bayesian', 'classic-optimized'
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateCombinationRequest;
    const {
      generationId,
      combinationCount,
      selectedNumbers = [],
      luckyNumber,
      isDouble = false,
      generationMethod = "follow-on",
    } = body;

    // Validate required parameters
    if (!generationId || !combinationCount || !luckyNumber) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: generationId, combinationCount, luckyNumber",
        },
        { status: 400 }
      );
    }

    // Validate numbers
    if (luckyNumber < 1 || luckyNumber > 49) {
      return NextResponse.json(
        { error: "Lucky number must be between 1 and 49" },
        { status: 400 }
      );
    }

    if (selectedNumbers.some((num: number) => num < 1 || num > 49)) {
      return NextResponse.json(
        { error: "All selected numbers must be between 1 and 49" },
        { status: 400 }
      );
    }

    // Use current date as parameter for cache key
    const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    // Generate combinations based on the selected method
    let combinations: number[][];

    // Get historical data (cached)
    const daysOfHistory = 1095;
    const pastResults = await getHistoricalDraws(daysOfHistory, currentDate);
    const lastDrawList = await getLastDraw(currentDate);

    const lastDrawNumbers =
      lastDrawList.length > 0
        ? [...lastDrawList[0].winningNumbers, lastDrawList[0].specialNumber]
        : undefined;

    switch (generationMethod) {
      case "classic":
        console.log(`Generating classic combinations for ${currentDate}`);
        const classicResults = generateClassicCombinations(
          combinationCount,
          selectedNumbers,
          luckyNumber,
          isDouble,
          pastResults
        );
        combinations = classicResults.map((result) => result.combination);
        break;
      case "follow-on":
        console.log(`Generating follow-on combinations for ${currentDate}`);
        if (!lastDrawList || lastDrawList.length === 0) {
          throw new Error("Could not fetch the last Mark Six result.");
        }
        const followOnResults = generateFollowOnCombinations(
          combinationCount,
          selectedNumbers,
          luckyNumber,
          isDouble,
          pastResults,
          lastDrawNumbers!
        );
        combinations = followOnResults.map((result) => result.combination);
        break;
      case "ensemble":
        console.log(`Generating ensemble combinations for ${currentDate}`);
        const ensembleResults = generateEnsembleCombinations(
          combinationCount,
          selectedNumbers,
          luckyNumber,
          isDouble,
          pastResults,
          lastDrawNumbers
        );
        combinations = ensembleResults.map((result) => result.combination);
        break;
      case "bayesian":
        console.log(`Generating bayesian combinations for ${currentDate}`);
        const bayesianResults = generateBayesianCombinations(
          combinationCount,
          selectedNumbers,
          luckyNumber,
          isDouble,
          pastResults,
          lastDrawNumbers
        );
        combinations = bayesianResults.map((result) => result.combination);
        break;
      case "classic-optimized":
        console.log(`Generating classic-optimized combinations for ${currentDate}`);
        const optimizedResults = generateClassicCombinationsOptimized(
          combinationCount,
          selectedNumbers,
          luckyNumber,
          isDouble,
          pastResults
        );
        combinations = optimizedResults.map((result) => result.combination);
        break;
      default:
        return NextResponse.json(
          {
            error:
              "Invalid generation method. Use: classic, follow-on, ensemble, bayesian, or classic-optimized",
          },
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
        createdAt: new Date(),
      };

      try {
        const data = await prisma.markSixGeneratedCombination.create({
          data: combinationData,
        });
        savedCombinations.push(data);
      } catch (error) {
        console.error(`Error saving combination ${i + 1}:`, error);
      }
    }

    return NextResponse.json({
      message: `Successfully generated ${savedCombinations.length} combinations`,
      generationId,
      combinations: savedCombinations,
    });
  } catch (error) {
    console.error("Error in POST /api/combinations:", error);
    return NextResponse.json(
      { error: "Failed to generate combinations" },
      { status: 500 }
    );
  }
}

/**
 * Get historical draws within the specified time period with caching
 */
const getHistoricalDraws = unstable_cache(
  async (daysOfHistory: number, currentDate: string) => {
    console.log(
      `[CACHE MISS] Fetching historical draws for ${daysOfHistory} days from ${currentDate}`
    );
    const cutoffDate = new Date(currentDate);
    cutoffDate.setDate(cutoffDate.getDate() - daysOfHistory);

    const result = await prisma.markSixResult.findMany({
      select: {
        drawDate: true,
        winningNumbers: true,
        specialNumber: true,
      },
      where: {
        drawDate: {
          gte: cutoffDate,
        },
      },
      orderBy: { drawDate: "asc" },
    });

    console.log(`[DB QUERY] Retrieved ${result.length} historical draws`);
    return result;
  },
  ["historical-draws"],
  { revalidate: 86400 } // 1 day cache
);

/**
 * Get the last draw with caching
 */
const getLastDraw = unstable_cache(
  async (currentDate: string) => {
    console.log(`[CACHE MISS] Fetching last draw for ${currentDate}`);
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.markSixResult.findMany({
      select: {
        winningNumbers: true,
        specialNumber: true,
      },
      where: {
        drawDate: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { drawDate: "desc" },
      take: 1,
    });

    console.log(`[DB QUERY] Retrieved last draw`);
    return result;
  },
  ["last-draw"],
  { revalidate: 3600 } // 1 hour cache for last draw
);

