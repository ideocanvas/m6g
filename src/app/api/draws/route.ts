import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Master API key validation
function validateMasterApiKey(request: NextRequest): boolean {
  const masterApiKey = process.env.MASTER_API_KEY;
  if (!masterApiKey) {
    console.error('MASTER_API_KEY environment variable not set');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedKey = authHeader.substring(7);
  return providedKey === masterApiKey;
}

// HKJC GraphQL query for fetching draw results
const HKJC_GRAPHQL_QUERY = `
  fragment lotteryDrawsFragment on LotteryDraw {
    id
    year
    no
    openDate
    closeDate
    drawDate
    status
    snowballCode
    snowballName_en
    snowballName_ch
    lotteryPool {
      sell
      status
      totalInvestment
      jackpot
      unitBet
      estimatedPrize
      derivedFirstPrizeDiv
      lotteryPrizes {
        type
        winningUnit
        dividend
      }
    }
    drawResult {
      drawnNo
      xDrawnNo
    }
  }

  query marksixResult($lastNDraw: Int, $startDate: String, $endDate: String, $drawType: LotteryDrawType) {
    lotteryDraws(
      lastNDraw: $lastNDraw
      startDate: $startDate
      endDate: $endDate
      drawType: $drawType
    ) {
      ...lotteryDrawsFragment
    }
  }
`;

interface HKJCDrawResult {
  id: string;
  drawDate: string;
  drawResult: {
    drawnNo: number[];
    xDrawnNo: number;
  };
  snowballCode?: string;
  snowballName_en?: string;
  snowballName_ch?: string;
  lotteryPool?: {
    totalInvestment: number;
    jackpot: number;
    unitBet: number;
    estimatedPrize: number;
  };
}

interface FetchDrawsRequest {
  startDate?: string;
  endDate?: string;
  days?: number;
}

interface HKJCGraphQLResponse {
  data?: {
    lotteryDraws: HKJCDrawResult[];
  };
}

/**
 * GET /api/draws - Get draw results
 * Query parameters:
 * - limit: number of results to return (default: 100)
 * - startDate: start date in YYYY-MM-DD format
 * - endDate: end date in YYYY-MM-DD format
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log(`GET /api/draws - limit: ${limit}, startDate: ${startDate}, endDate: ${endDate}`);

    let whereClause = {};
    if (startDate || endDate) {
      // Convert YYYY-MM-DD to DD/MM/YYYY format for dateText comparison
      const convertToDateTextFormat = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      };

      whereClause = {
        dateText: {
          ...(startDate && { gte: convertToDateTextFormat(startDate) }),
          ...(endDate && { lte: convertToDateTextFormat(endDate) })
        }
      };
    }

    console.log('Query where clause:', JSON.stringify(whereClause));

    const data = await prisma.markSixResult.findMany({
      where: whereClause,
      orderBy: { drawDate: 'desc' },
      take: limit
    });

    console.log(`Found ${data.length} records`);

    // Convert BigInt values to strings for JSON serialization
    const serializableData = data.map(result => ({
      ...result,
      totalInvestment: result.totalInvestment?.toString() || null,
      jackpot: result.jackpot?.toString() || null,
      estimatedPrize: result.estimatedPrize?.toString() || null
    }));

    return NextResponse.json({
      data: serializableData,
      count: data.length,
      query: {
        limit,
        startDate,
        endDate,
        whereClause
      }
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/draws:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/draws - Fetch latest draw results from HKJC API
 * Requires MASTER_API_KEY authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Validate master API key
    if (!validateMasterApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as FetchDrawsRequest;
    const { startDate, endDate, days = 10 } = body;

    // Calculate date range if not provided
    const end = endDate || null;
    const start = startDate || null;
    const lastNDraw = (!startDate && !endDate) ? days : null;

    console.log(`Fetching HKJC draw results - startDate: ${start}, endDate: ${end}, lastNDraw: ${lastNDraw}`);

    // Fetch data from HKJC GraphQL API
    const requestData = {
      operationName: "marksixResult",
      variables: {
        lastNDraw: lastNDraw,
        startDate: start,
        endDate: end,
        drawType: "All"
      },
      query: HKJC_GRAPHQL_QUERY
    };

    const response = await fetch('https://info.cld.hkjc.com/graphql/base/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HKJC API responded with status: ${response.status}`);
    }

    const result = await response.json() as HKJCGraphQLResponse;
    const draws: HKJCDrawResult[] = result.data?.lotteryDraws || [];

    console.log(`Fetched ${draws.length} draws from HKJC API`);

    // Process and save the draw results
    const savedResults = [];
    const existingDraws = [];
    for (const draw of draws) {
      if (!draw.drawResult?.drawnNo || !draw.drawResult?.xDrawnNo) {
        console.warn(`Skipping draw ${draw.id}: missing draw result data`);
        continue;
      }

      // Check if draw already exists
      const existingDraw = await prisma.markSixResult.findUnique({
        where: { drawId: draw.id }
      });

      if (existingDraw) {
        console.log(`Draw ${draw.id} already exists, skipping`);
        existingDraws.push(existingDraw);
        continue;
      }

      // Format date for storage - handle HKJC date format with timezone offset
      let drawDate: Date;
      
      // Pattern match for HKJC date format: YYYY-MM-DD+HH:MM
      const hkjcDatePattern = /^(\d{4}-\d{2}-\d{2})\+(\d{2}:\d{2})$/;
      const match = draw.drawDate.match(hkjcDatePattern);
      
      if (match) {
        // Valid HKJC date format: convert to proper ISO format
        const [, datePart, timezonePart] = match;
        drawDate = new Date(datePart + 'T00:00:00' + '+' + timezonePart);
      } else {
        // Try parsing as standard date format
        drawDate = new Date(draw.drawDate);
      }
      
      if (isNaN(drawDate.getTime())) {
        console.warn(`Skipping draw ${draw.id}: invalid draw date "${draw.drawDate}"`);
        continue;
      }
      
      const dateText = `${drawDate.getDate().toString().padStart(2, '0')}/${(drawDate.getMonth() + 1).toString().padStart(2, '0')}/${drawDate.getFullYear()}`;

      const drawData = {
        drawId: draw.id,
        drawDate: drawDate,
        dateText: dateText,
        winningNumbers: draw.drawResult.drawnNo,
        specialNumber: draw.drawResult.xDrawnNo,
        snowballCode: draw.snowballCode,
        snowballNameEn: draw.snowballName_en,
        snowballNameCh: draw.snowballName_ch,
        totalInvestment: draw.lotteryPool?.totalInvestment ? BigInt(draw.lotteryPool.totalInvestment) : null,
        jackpot: draw.lotteryPool?.jackpot ? BigInt(draw.lotteryPool.jackpot) : null,
        unitBet: draw.lotteryPool?.unitBet,
        estimatedPrize: draw.lotteryPool?.estimatedPrize ? BigInt(draw.lotteryPool.estimatedPrize) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert into database
      try {
        const data = await prisma.markSixResult.create({
          data: drawData
        });
        savedResults.push(data);
        console.log(`Saved draw ${draw.id}`);
      } catch (error) {
        console.error(`Error saving draw ${draw.id}:`, error);
      }
    }

    // Convert BigInt values to strings for JSON serialization
    const serializableResults = savedResults.map(result => ({
      ...result,
      totalInvestment: result.totalInvestment?.toString() || null,
      jackpot: result.jackpot?.toString() || null,
      estimatedPrize: result.estimatedPrize?.toString() || null
    }));

    const serializableExistingDraws = existingDraws.map(draw => ({
      ...draw,
      totalInvestment: draw.totalInvestment?.toString() || null,
      jackpot: draw.jackpot?.toString() || null,
      estimatedPrize: draw.estimatedPrize?.toString() || null
    }));

    return NextResponse.json({
      message: `Successfully processed ${draws.length} draws`,
      totalFetched: draws.length,
      saved: savedResults.length,
      existing: existingDraws.length,
      savedResults: serializableResults,
      existingDraws: serializableExistingDraws
    });

  } catch (error) {
    console.error('Error in POST /api/draws:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draw results from HKJC API' },
      { status: 500 }
    );
  }
}