import { NextResponse } from 'next/server'

/**
 * POST /api/agentsv2/responses
 * 
 * Agents v2 Responses API (single-call pattern)
 * Uses bearer token from environment for testing
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const bearerToken = process.env.FOUNDRY_BEARER_TOKEN

    if (!bearerToken) {
      return NextResponse.json(
        { error: 'FOUNDRY_BEARER_TOKEN is not configured' },
        { status: 500 }
      )
    }

    const endpoint = process.env.FOUNDRY_PROJECT_ENDPOINT
    if (!endpoint) {
      return NextResponse.json(
        { error: 'FOUNDRY_PROJECT_ENDPOINT is not configured' },
        { status: 500 }
      )
    }

    // Call Agents v2 Responses API
    const url = `${endpoint}/agents/responses?api-version=2025-05-01`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Agents API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      return NextResponse.json(
        { 
          error: 'Failed to get response from Agents API',
          details: errorText,
          status: response.status 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error calling Agents API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
