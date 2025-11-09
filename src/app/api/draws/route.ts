import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

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

    const supabase = getSupabaseClient();
    let query = supabase
      .from('mark6_results')
      .select('*')
      .order('draw_date', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('draw_date', startDate);
    }
    if (endDate) {
      query = query.lte('draw_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching draw results:', error);
      return NextResponse.json({ error: 'Failed to fetch draw results' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in GET /api/draws:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const { startDate, endDate, days = 30 } = body;

    // Calculate date range if not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`Fetching HKJC draw results from ${start} to ${end}`);

    // Fetch data from HKJC GraphQL API
    const requestData = {
      operationName: "marksixResult",
      variables: {
        lastNDraw: null,
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
    for (const draw of draws) {
      if (!draw.drawResult?.drawnNo || !draw.drawResult?.xDrawnNo) {
        console.warn(`Skipping draw ${draw.id}: missing draw result data`);
        continue;
      }

      // Check if draw already exists
      const supabase = getSupabaseClient();
      const { data: existingDraw } = await supabase
        .from('mark6_results')
        .select('draw_id')
        .eq('draw_id', draw.id)
        .single();

      if (existingDraw) {
        console.log(`Draw ${draw.id} already exists, skipping`);
        continue;
      }

      // Format date for storage
      const drawDate = new Date(draw.drawDate);
      const dateText = `${drawDate.getDate().toString().padStart(2, '0')}/${(drawDate.getMonth() + 1).toString().padStart(2, '0')}/${drawDate.getFullYear()}`;

      const drawData = {
        draw_id: draw.id,
        draw_date: draw.drawDate,
        date_text: dateText,
        winning_numbers: draw.drawResult.drawnNo,
        special_number: draw.drawResult.xDrawnNo,
        snowball_code: draw.snowballCode,
        snowball_name_en: draw.snowballName_en,
        snowball_name_ch: draw.snowballName_ch,
        total_investment: draw.lotteryPool?.totalInvestment,
        jackpot: draw.lotteryPool?.jackpot,
        unit_bet: draw.lotteryPool?.unitBet,
        estimated_prize: draw.lotteryPool?.estimatedPrize,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert into database
      const { data, error } = await supabase
        .from('mark6_results')
        .insert(drawData)
        .select();

      if (error) {
        console.error(`Error saving draw ${draw.id}:`, error);
      } else {
        savedResults.push(data[0]);
        console.log(`Saved draw ${draw.id}`);
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${draws.length} draws`,
      saved: savedResults.length,
      results: savedResults
    });

  } catch (error) {
    console.error('Error in POST /api/draws:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draw results from HKJC API' },
      { status: 500 }
    );
  }
}