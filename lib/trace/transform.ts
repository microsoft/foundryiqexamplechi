/**
 * Transform raw Knowledge Retrieval API responses into UI-ready trace data
 */

import {
  KnowledgeBaseRetrievalResponse,
  KnowledgeBaseActivityRecord,
  KnowledgeBaseReference,
  RetrievalActivityRecord,
  isRetrievalActivity,
  isModelActivity,
  calculateTokenUsage,
  getPerformanceMetrics,
  TokenUsageSummary,
  PerformanceMetrics
} from '@/types/knowledge-retrieval'

// ============================================================================
// UI DATA STRUCTURES
// ============================================================================

export interface TraceSummary {
  status: 'success' | 'partial' | 'failed'
  totalElapsedMs: number
  totalTokens: number
  iterationCount: number
  activitiesCount: number
  uniqueSourcesCount: number
  totalResultsCount: number
  tokenUsage: TokenUsageSummary
  performanceMetrics: PerformanceMetrics
}

export interface TraceIteration {
  id: number
  planningActivity?: KnowledgeBaseActivityRecord
  retrievalActivities: KnowledgeBaseActivityRecord[]
  reasoningActivity?: KnowledgeBaseActivityRecord
  synthesisActivity?: KnowledgeBaseActivityRecord
}

export interface ProcessedTrace {
  summary: TraceSummary
  iterations: TraceIteration[]
  finalReferences: KnowledgeBaseReference[]
  answerText: string
  hasError: boolean
}

// ============================================================================
// TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transform raw API response into UI-ready trace structure
 */
export function transformKnowledgeRetrievalResponse(
  response: KnowledgeBaseRetrievalResponse
): ProcessedTrace {
  const activities = response.activity || []
  const references = response.references || []
  
  // Calculate metrics
  const tokenUsage = calculateTokenUsage(activities)
  const performanceMetrics = getPerformanceMetrics(activities)
  
  // Derive iterations (group activities into logical phases)
  const iterations = deriveIterations(activities)
  
  // Extract answer text
  const answerText = extractAnswerText(response.response)
  
  // Determine status
  const hasError = activities.some(act => act.error)
  const status: 'success' | 'partial' | 'failed' = hasError 
    ? (references.length > 0 ? 'partial' : 'failed')
    : 'success'
  
  // Count unique sources
  const retrievalActivities = activities.filter(isRetrievalActivity) as RetrievalActivityRecord[]
  const uniqueSources = new Set(
    retrievalActivities.map(act => act.knowledgeSourceName)
  )
  
  // Sum total results
  const totalResults = retrievalActivities.reduce((sum, act) => sum + act.count, 0)
  
  const summary: TraceSummary = {
    status,
    totalElapsedMs: performanceMetrics.totalElapsedMs,
    totalTokens: tokenUsage.totalTokens,
    iterationCount: iterations.length,
    activitiesCount: activities.length,
    uniqueSourcesCount: uniqueSources.size,
    totalResultsCount: totalResults,
    tokenUsage,
    performanceMetrics
  }
  
  return {
    summary,
    iterations,
    finalReferences: references,
    answerText,
    hasError
  }
}

/**
 * Group activities into logical iterations
 * Each iteration represents: Planning → Retrieval(s) → Reasoning → Synthesis
 */
function deriveIterations(activities: KnowledgeBaseActivityRecord[]): TraceIteration[] {
  const iterations: TraceIteration[] = []
  let currentIteration: TraceIteration | null = null
  let iterationId = 1
  
  activities.forEach((activity) => {
    // Start new iteration on planning or if we have retrievals without a current iteration
    if (activity.type === 'modelQueryPlanning' || (!currentIteration && isRetrievalActivity(activity))) {
      if (currentIteration) {
        iterations.push(currentIteration)
      }
      currentIteration = {
        id: iterationId++,
        retrievalActivities: []
      }
      
      if (activity.type === 'modelQueryPlanning') {
        currentIteration.planningActivity = activity
      }
    }
    
    // Add retrieval activities
    if (isRetrievalActivity(activity)) {
      if (!currentIteration) {
        currentIteration = {
          id: iterationId++,
          retrievalActivities: []
        }
      }
      currentIteration.retrievalActivities.push(activity)
    }
    
    // Add reasoning
    if (activity.type === 'agenticReasoning' && currentIteration) {
      currentIteration.reasoningActivity = activity
    }
    
    // Add synthesis and close iteration
    if (activity.type === 'modelAnswerSynthesis') {
      if (!currentIteration) {
        currentIteration = {
          id: iterationId++,
          retrievalActivities: []
        }
      }
      currentIteration.synthesisActivity = activity
      iterations.push(currentIteration)
      currentIteration = null
    }
  })
  
  // Push any remaining iteration
  if (currentIteration) {
    iterations.push(currentIteration)
  }
  
  return iterations
}

/**
 * Extract answer text from response messages
 */
function extractAnswerText(messages: any[]): string {
  if (!messages || messages.length === 0) return ''
  
  const assistantMessage = messages.find(msg => msg.role === 'assistant')
  if (!assistantMessage || !assistantMessage.content) return ''
  
  const textContent = assistantMessage.content.find((c: any) => c.type === 'text')
  return textContent?.text || ''
}

/**
 * Get source type label for display
 */
export function getSourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    searchIndex: 'Search Index',
    azureBlob: 'Azure Blob',
    web: 'Web',
    remoteSharePoint: 'SharePoint (Remote)',
    indexedSharePoint: 'SharePoint (Indexed)',
    indexedOneLake: 'OneLake',
    mcpTool: 'MCP Tool'
  }
  return labels[type] || 'Other'
}

/**
 * Get phase label and tone for activity type
 */
export function getPhaseInfo(type: string): { label: string; tone: string; description: string } {
  const phases: Record<string, { label: string; tone: string; description: string }> = {
    modelQueryPlanning: {
      label: 'Query Planning',
      tone: 'planning',
      description: 'Decomposes the user request, selects sources, and drafts search variants'
    },
    searchIndex: {
      label: 'Query Execution',
      tone: 'retrieval',
      description: 'Executes a search against a knowledge source'
    },
    azureBlob: {
      label: 'Document Retrieval',
      tone: 'retrieval',
      description: 'Retrieves documents from Azure Blob Storage'
    },
    web: {
      label: 'Web Search',
      tone: 'retrieval',
      description: 'Executes a web search'
    },
    remoteSharePoint: {
      label: 'SharePoint Query',
      tone: 'retrieval',
      description: 'Queries SharePoint documents via Graph API'
    },
    indexedSharePoint: {
      label: 'SharePoint Search',
      tone: 'retrieval',
      description: 'Searches indexed SharePoint content'
    },
    indexedOneLake: {
      label: 'OneLake Search',
      tone: 'retrieval',
      description: 'Searches indexed OneLake content'
    },
    agenticReasoning: {
      label: 'Result Assessment',
      tone: 'assessment',
      description: 'Evaluates retrieval quality and decides to iterate or exit'
    },
    modelAnswerSynthesis: {
      label: 'Answer Synthesis',
      tone: 'synthesis',
      description: 'Builds the final response or structured output'
    }
  }
  
  return phases[type] || {
    label: 'Processing',
    tone: 'neutral',
    description: 'Processing step'
  }
}

/**
 * Format milliseconds for display
 */
export function formatElapsedTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

/**
 * Format token count for display
 */
export function formatTokenCount(count: number): string {
  if (count < 1000) return count.toString()
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`
  return `${(count / 1000000).toFixed(2)}M`
}
