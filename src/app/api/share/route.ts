import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

interface ShareData {
  generationId: string;
  combinations: Array<{
    combinationNumbers: number[];
    isDouble: boolean;
    splitNumbers?: number[];
    selectedNumbers: number[];
    luckyNumber: number;
    combinationCount: number;
    generationMethod: string;
  }>;
}

interface ShareRequestBody {
  data: ShareData;
  baseUrl?: string;
}

interface ShareEntry {
  data: ShareData;
  createdAt: string;
  expiresAt: string;
}

// Generate a short ID
function generateShortId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ShareRequestBody;
    const { data } = body;

    if (!data) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    // Get the Cloudflare context
    const { env } = getCloudflareContext();

    const SHARE_KV = env.SHARE_KV;

    if (!SHARE_KV) {
      return NextResponse.json(
        { error: "KV storage not available" },
        { status: 500 }
      );
    }

    // Generate a unique short ID
    let shortId: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shortId = generateShortId();
      const existing = await SHARE_KV.get(shortId);

      if (!existing) {
        // Store the data with expiration (24 hours)
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        
        const shareEntry: ShareEntry = {
          data,
          createdAt: now.toISOString(),
          expiresAt: expiresAt.toISOString()
        };

        // Store in Cloudflare KV with expiration
        await SHARE_KV.put(shortId, JSON.stringify(shareEntry), {
          expirationTtl: 24 * 60 * 60 // 24 hours in seconds
        });
        break;
      }

      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Failed to generate unique short code" },
        { status: 500 }
      );
    }

    // Use the base URL provided by the frontend (from window.location)
    const baseUrl = body.baseUrl || request.nextUrl.origin;
    const shortUrl = `${baseUrl}/?s=${shortId}`;

    return NextResponse.json({ 
      shortUrl,
      shortId,
      expiresAt: new Date().getTime() + 24 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error('Error creating share URL:', error);
    return NextResponse.json({ error: 'Failed to create share URL' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shortId = searchParams.get('id');

    if (!shortId) {
      return NextResponse.json({ error: 'No short ID provided' }, { status: 400 });
    }

    // Get the Cloudflare context
    const { env } = getCloudflareContext();

    const SHARE_KV = env.SHARE_KV;

    if (!SHARE_KV) {
      return NextResponse.json(
        { error: "KV storage not available" },
        { status: 500 }
      );
    }

    // Get from Cloudflare KV
    const entry = await SHARE_KV.get(shortId);
    
    if (!entry) {
      return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 });
    }

    const shareEntry: ShareEntry = JSON.parse(entry);

    // Check if expired (additional safety check)
    const expiresAt = new Date(shareEntry.expiresAt);
    if (expiresAt < new Date()) {
      // Delete expired entry
      await SHARE_KV.delete(shortId);
      return NextResponse.json({ error: 'Share link expired' }, { status: 410 });
    }

    return NextResponse.json({ 
      data: shareEntry.data,
      createdAt: shareEntry.createdAt,
      expiresAt: shareEntry.expiresAt
    });
  } catch (error) {
    console.error('Error retrieving share data:', error);
    return NextResponse.json({ error: 'Failed to retrieve share data' }, { status: 500 });
  }
}