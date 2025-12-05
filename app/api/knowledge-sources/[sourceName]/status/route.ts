import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering - this route always needs fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

const ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT
const API_KEY = process.env.AZURE_SEARCH_API_KEY
const API_VERSION = process.env.AZURE_SEARCH_API_VERSION

interface RouteContext {
  params: Promise<{ sourceName: string }> | { sourceName: string }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    if (!ENDPOINT || !API_KEY || !API_VERSION) {
      console.error('Azure Search configuration missing:', { 
        hasEndpoint: !!ENDPOINT, 
        hasApiKey: !!API_KEY, 
        hasApiVersion: !!API_VERSION 
      })
      return NextResponse.json(
        { error: 'Azure Search configuration missing' },
        { status: 500 }
      )
    }

    // Handle both sync and async params for Next.js 14/15 compatibility
    const params = context.params instanceof Promise ? await context.params : context.params
    const { sourceName } = params

    if (!sourceName) {
      console.error('Source name is missing from params')
      return NextResponse.json(
        { error: 'Source name is required' },
        { status: 400 }
      )
    }

    const url = `${ENDPOINT}/knowledgesources('${sourceName}')/status?api-version=${API_VERSION}`
    console.log('Fetching knowledge source status:', { sourceName, url })

    const response = await fetch(url, {
      headers: {
        'api-key': API_KEY,
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorText = await response.text()
      let parsedError: unknown = errorText
      try {
        parsedError = JSON.parse(errorText)
      } catch {
        // keep as text
      }

      console.error('Azure Search API error:', {
        sourceName,
        status: response.status,
        statusText: response.statusText,
        error: parsedError
      })

      return NextResponse.json(
        {
          error: `Failed to fetch knowledge source status (${response.status})`,
          azureError: parsedError,
          details: errorText
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Knowledge source status API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
