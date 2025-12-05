import { NextResponse } from 'next/server'

/**
 * GET /api/agentsv2/connections
 * 
 * Lists Remote Tool connections for the AI Foundry project using Azure Management API
 * Uses bearer token from environment for testing
 */
export async function GET() {
  try {
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID
    const resourceGroup = process.env.AZURE_RESOURCE_GROUP
    const projectName = process.env.FOUNDRY_PROJECT_NAME
    const bearerToken = process.env.AZURE_MANAGEMENT_BEARER_TOKEN

    if (!subscriptionId || !resourceGroup || !projectName) {
      return NextResponse.json(
        { error: 'Missing required environment variables: AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP, FOUNDRY_PROJECT_NAME' },
        { status: 500 }
      )
    }

    if (!bearerToken) {
      return NextResponse.json(
        { error: 'AZURE_MANAGEMENT_BEARER_TOKEN is not configured' },
        { status: 500 }
      )
    }

    const url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.MachineLearningServices/workspaces/${projectName}/connections?api-version=2024-04-01`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Azure Management API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      return NextResponse.json(
        { 
          error: 'Failed to fetch connections from Azure Management API',
          details: errorText,
          status: response.status 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching connections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
