/**
 * Azure AI Search Knowledge Retrieval API Response Contracts
 * API Version: 2025-11-01-preview
 * 
 * Complete TypeScript definitions for Knowledge Retrieval responses,
 * including all supported knowledge source types and their respective activity records.
 */

// ============================================================================
// CORE RESPONSE STRUCTURE
// ============================================================================

export interface KnowledgeBaseRetrievalResponse {
  response: KnowledgeBaseMessage[]
  activity: KnowledgeBaseActivityRecord[]
  references: KnowledgeBaseReference[]
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface KnowledgeBaseMessage {
  role?: 'user' | 'assistant' | 'system'
  content: KnowledgeBaseMessageContent[]
}

export type KnowledgeBaseMessageContent =
  | KnowledgeBaseMessageTextContent
  | KnowledgeBaseMessageImageContent

export interface KnowledgeBaseMessageTextContent {
  type: 'text'
  text: string
}

export interface KnowledgeBaseMessageImageContent {
  type: 'image'
  image: {
    url: string
  }
}

// ============================================================================
// ACTIVITY RECORDS - BASE TYPES
// ============================================================================

export interface BaseKnowledgeBaseActivityRecord {
  id: number
  type: string
  elapsedMs?: number
  error?: KnowledgeBaseErrorDetail
}

export interface BaseKnowledgeBaseRetrievalActivityRecord extends BaseKnowledgeBaseActivityRecord {
  knowledgeSourceName: string
  queryTime: string
  count: number
}

export interface KnowledgeBaseErrorDetail {
  code: string
  message: string
  target?: string
}

// ============================================================================
// ACTIVITY RECORDS - RETRIEVAL ACTIVITIES
// ============================================================================

export interface KnowledgeBaseSearchIndexActivityRecord extends BaseKnowledgeBaseRetrievalActivityRecord {
  type: 'searchIndex'
  searchIndexArguments: {
    search: string
    filter?: string
  }
}

export interface KnowledgeBaseAzureBlobActivityRecord extends BaseKnowledgeBaseRetrievalActivityRecord {
  type: 'azureBlob'
  azureBlobArguments: {
    search: string
  }
}

export interface KnowledgeBaseWebActivityRecord extends BaseKnowledgeBaseRetrievalActivityRecord {
  type: 'web'
  webArguments: {
    search: string
    language: string | null
    market: string | null
    count: number | null
    freshness: string | null
  }
}

export interface KnowledgeBaseRemoteSharePointActivityRecord extends BaseKnowledgeBaseRetrievalActivityRecord {
  type: 'remoteSharePoint'
  remoteSharePointArguments: {
    search: string
    filterExpressionAddOn?: string
  }
}

export interface KnowledgeBaseIndexedSharePointActivityRecord extends BaseKnowledgeBaseRetrievalActivityRecord {
  type: 'indexedSharePoint'
  indexedSharePointArguments: {
    search: string
  }
}

export interface KnowledgeBaseIndexedOneLakeActivityRecord extends BaseKnowledgeBaseRetrievalActivityRecord {
  type: 'indexedOneLake'
  indexedOneLakeArguments: {
    search: string
  }
}

// ============================================================================
// ACTIVITY RECORDS - MODEL & PROCESSING ACTIVITIES
// ============================================================================

export interface KnowledgeBaseModelQueryPlanningActivityRecord extends BaseKnowledgeBaseActivityRecord {
  type: 'modelQueryPlanning'
  inputTokens: number
  outputTokens: number
}

export interface KnowledgeBaseModelAnswerSynthesisActivityRecord extends BaseKnowledgeBaseActivityRecord {
  type: 'modelAnswerSynthesis'
  inputTokens: number
  outputTokens: number
}

export interface KnowledgeBaseAgenticReasoningActivityRecord extends BaseKnowledgeBaseActivityRecord {
  type: 'agenticReasoning'
  reasoningTokens: number
  retrievalReasoningEffort: {
    kind: 'minimal' | 'low' | 'medium' | 'high'
  }
}

export type KnowledgeBaseActivityRecord =
  | KnowledgeBaseSearchIndexActivityRecord
  | KnowledgeBaseAzureBlobActivityRecord
  | KnowledgeBaseWebActivityRecord
  | KnowledgeBaseRemoteSharePointActivityRecord
  | KnowledgeBaseIndexedSharePointActivityRecord
  | KnowledgeBaseIndexedOneLakeActivityRecord
  | KnowledgeBaseModelQueryPlanningActivityRecord
  | KnowledgeBaseModelAnswerSynthesisActivityRecord
  | KnowledgeBaseAgenticReasoningActivityRecord

// ============================================================================
// REFERENCES - BASE TYPES
// ============================================================================

export interface BaseKnowledgeBaseReference {
  type: string
  id: string
  activitySource: number
  sourceData?: Record<string, any> | null
  rerankerScore?: number
}

// ============================================================================
// REFERENCES - KNOWLEDGE SOURCE SPECIFIC TYPES
// ============================================================================

export interface KnowledgeBaseSearchIndexReference extends BaseKnowledgeBaseReference {
  type: 'searchIndex'
  docKey: string
  sourceData?: Record<string, any> | null
}

export interface KnowledgeBaseAzureBlobReference extends BaseKnowledgeBaseReference {
  type: 'azureBlob'
  blobUrl: string
  sourceData?: Record<string, any> | null
}

export interface KnowledgeBaseWebReference extends BaseKnowledgeBaseReference {
  type: 'web'
  url: string
  title: string
  sourceData?: Record<string, any> | null
}

export interface KnowledgeBaseRemoteSharePointReference extends BaseKnowledgeBaseReference {
  type: 'remoteSharePoint'
  webUrl: string
  searchSensitivityLabelInfo?: SharePointSensitivityLabelInfo
  sourceData?: Record<string, any> | null
}

export interface SharePointSensitivityLabelInfo {
  displayName: string
  sensitivityLabelId: string
  tooltip?: string
  priority?: number
  color?: string
  isEncrypted?: boolean
}

export interface KnowledgeBaseIndexedSharePointReference extends BaseKnowledgeBaseReference {
  type: 'indexedSharePoint'
  docUrl: string
  sourceData?: Record<string, any> | null
}

export interface KnowledgeBaseIndexedOneLakeReference extends BaseKnowledgeBaseReference {
  type: 'indexedOneLake'
  docUrl: string
  sourceData?: Record<string, any> | null
}

export type KnowledgeBaseReference =
  | KnowledgeBaseSearchIndexReference
  | KnowledgeBaseAzureBlobReference
  | KnowledgeBaseWebReference
  | KnowledgeBaseRemoteSharePointReference
  | KnowledgeBaseIndexedSharePointReference
  | KnowledgeBaseIndexedOneLakeReference

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSearchIndexReference(ref: KnowledgeBaseReference): ref is KnowledgeBaseSearchIndexReference {
  return ref.type === 'searchIndex'
}

export function isAzureBlobReference(ref: KnowledgeBaseReference): ref is KnowledgeBaseAzureBlobReference {
  return ref.type === 'azureBlob'
}

export function isWebReference(ref: KnowledgeBaseReference): ref is KnowledgeBaseWebReference {
  return ref.type === 'web'
}

export function isRemoteSharePointReference(ref: KnowledgeBaseReference): ref is KnowledgeBaseRemoteSharePointReference {
  return ref.type === 'remoteSharePoint'
}

export function isIndexedSharePointReference(ref: KnowledgeBaseReference): ref is KnowledgeBaseIndexedSharePointReference {
  return ref.type === 'indexedSharePoint'
}

export function isIndexedOneLakeReference(ref: KnowledgeBaseReference): ref is KnowledgeBaseIndexedOneLakeReference {
  return ref.type === 'indexedOneLake'
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type RetrievalActivityRecord =
  | KnowledgeBaseSearchIndexActivityRecord
  | KnowledgeBaseAzureBlobActivityRecord
  | KnowledgeBaseWebActivityRecord
  | KnowledgeBaseRemoteSharePointActivityRecord
  | KnowledgeBaseIndexedSharePointActivityRecord
  | KnowledgeBaseIndexedOneLakeActivityRecord

export function isRetrievalActivity(activity: KnowledgeBaseActivityRecord): activity is RetrievalActivityRecord {
  return ['searchIndex', 'azureBlob', 'web', 'remoteSharePoint', 'indexedSharePoint', 'indexedOneLake'].includes(activity.type)
}

export function isModelActivity(activity: KnowledgeBaseActivityRecord): activity is 
  KnowledgeBaseModelQueryPlanningActivityRecord | KnowledgeBaseModelAnswerSynthesisActivityRecord {
  return activity.type === 'modelQueryPlanning' || activity.type === 'modelAnswerSynthesis'
}

export interface InlineCitation {
  refId: string
  startIndex: number
  endIndex: number
}

export function parseInlineCitations(text: string): InlineCitation[] {
  const citations: InlineCitation[] = []
  const regex = /\[ref_id:(\d+)\]/g
  let match
  
  while ((match = regex.exec(text)) !== null) {
    citations.push({
      refId: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }
  
  return citations
}

export function stripInlineCitations(text: string): string {
  return text.replace(/\[ref_id:\d+\]/g, '')
}

export function mapCitationsToReferences(
  text: string,
  references: KnowledgeBaseReference[]
): Map<string, KnowledgeBaseReference> {
  const citationMap = new Map<string, KnowledgeBaseReference>()
  const citations = parseInlineCitations(text)
  
  citations.forEach(citation => {
    const reference = references.find(ref => ref.id === citation.refId)
    if (reference) {
      citationMap.set(citation.refId, reference)
    }
  })
  
  return citationMap
}

export interface TokenUsageSummary {
  queryPlanningInputTokens: number
  queryPlanningOutputTokens: number
  answerSynthesisInputTokens: number
  answerSynthesisOutputTokens: number
  reasoningTokens: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
}

export function calculateTokenUsage(activities: KnowledgeBaseActivityRecord[]): TokenUsageSummary {
  const summary: TokenUsageSummary = {
    queryPlanningInputTokens: 0,
    queryPlanningOutputTokens: 0,
    answerSynthesisInputTokens: 0,
    answerSynthesisOutputTokens: 0,
    reasoningTokens: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0
  }
  
  activities.forEach(activity => {
    if (activity.type === 'modelQueryPlanning') {
      summary.queryPlanningInputTokens += activity.inputTokens
      summary.queryPlanningOutputTokens += activity.outputTokens
    } else if (activity.type === 'modelAnswerSynthesis') {
      summary.answerSynthesisInputTokens += activity.inputTokens
      summary.answerSynthesisOutputTokens += activity.outputTokens
    } else if (activity.type === 'agenticReasoning') {
      summary.reasoningTokens += activity.reasoningTokens
    }
  })
  
  summary.totalInputTokens = summary.queryPlanningInputTokens + summary.answerSynthesisInputTokens
  summary.totalOutputTokens = summary.queryPlanningOutputTokens + summary.answerSynthesisOutputTokens
  summary.totalTokens = summary.totalInputTokens + summary.totalOutputTokens + summary.reasoningTokens
  
  return summary
}

export interface PerformanceMetrics {
  totalElapsedMs: number
  retrievalElapsedMs: number
  modelElapsedMs: number
  reasoningElapsedMs: number
  knowledgeSourceBreakdown: Map<string, {
    count: number
    totalDocs: number
    avgElapsedMs: number
  }>
}

export function getPerformanceMetrics(activities: KnowledgeBaseActivityRecord[]): PerformanceMetrics {
  const metrics: PerformanceMetrics = {
    totalElapsedMs: 0,
    retrievalElapsedMs: 0,
    modelElapsedMs: 0,
    reasoningElapsedMs: 0,
    knowledgeSourceBreakdown: new Map()
  }
  
  activities.forEach(activity => {
    const elapsed = activity.elapsedMs || 0
    metrics.totalElapsedMs += elapsed
    
    if (isRetrievalActivity(activity)) {
      metrics.retrievalElapsedMs += elapsed
      
      const sourceName = activity.knowledgeSourceName
      const existing = metrics.knowledgeSourceBreakdown.get(sourceName) || {
        count: 0,
        totalDocs: 0,
        avgElapsedMs: 0
      }
      
      existing.count++
      existing.totalDocs += activity.count
      existing.avgElapsedMs = ((existing.avgElapsedMs * (existing.count - 1)) + elapsed) / existing.count
      
      metrics.knowledgeSourceBreakdown.set(sourceName, existing)
    } else if (isModelActivity(activity)) {
      metrics.modelElapsedMs += elapsed
    } else if (activity.type === 'agenticReasoning') {
      metrics.reasoningElapsedMs += elapsed
    }
  })
  
  return metrics
}
