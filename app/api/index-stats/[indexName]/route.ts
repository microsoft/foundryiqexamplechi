import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route always needs fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

const ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT;
const API_KEY = process.env.AZURE_SEARCH_API_KEY;
const API_VERSION = process.env.AZURE_SEARCH_API_VERSION;

interface RouteContext {
  params: Promise<{ indexName: string }> | { indexName: string };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = context.params instanceof Promise ? await context.params : context.params;
  const { indexName } = params;
  if (!indexName) {
    return NextResponse.json({ error: 'Index name required' }, { status: 400 });
  }

  try {
    const url = `${ENDPOINT}/indexes/${encodeURIComponent(indexName)}/stats?api-version=${API_VERSION}`;
    const response = await fetch(url, {
      headers: {
        'api-key': API_KEY!,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: 'Failed to fetch index stats', details: text }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}