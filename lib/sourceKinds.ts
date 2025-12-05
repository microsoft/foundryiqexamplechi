export enum SourceKind {
  SearchIndex = 'searchIndex',
  AzureBlob = 'azureBlob',
  Web = 'web',
  IndexedOneLake = 'indexedOneLake',
  RemoteSharePoint = 'remoteSharePoint',
  IndexedSharePoint = 'indexedSharePoint'
}

export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  [SourceKind.SearchIndex]: 'Azure AI Search Index',
  [SourceKind.AzureBlob]: 'Azure Blob Storage',
  [SourceKind.Web]: 'Web',
  [SourceKind.IndexedOneLake]: 'Microsoft OneLake',
  [SourceKind.RemoteSharePoint]: 'SharePoint (Remote)',
  [SourceKind.IndexedSharePoint]: 'SharePoint (Indexed)'
}

export const SOURCE_KIND_ICON_PATH: Record<SourceKind, string> = {
  [SourceKind.SearchIndex]: '/icons/search_icon.svg',
  [SourceKind.AzureBlob]: '/icons/blob.svg',
  [SourceKind.Web]: '/icons/web.svg',
  [SourceKind.IndexedOneLake]: '/icons/onelake-color.svg',
  [SourceKind.RemoteSharePoint]: '/icons/sharepoint.svg',
  [SourceKind.IndexedSharePoint]: '/icons/sharepoint.svg'
}

export type SourceDetail = { name: string; kind: SourceKind }

export function getSourceKindLabel(kind: string): string {
  const normalized = kind.toLowerCase()
  const enumValues = Object.values(SourceKind)
  const matchedEnum = enumValues.find(ev => ev.toLowerCase() === normalized)
  
  if (matchedEnum) {
    return SOURCE_KIND_LABEL[matchedEnum as SourceKind]
  }
  
  // Fallback to capitalized kind name
  return kind.charAt(0).toUpperCase() + kind.slice(1)
}

export function aggregateKinds(details: SourceDetail[] | undefined) {
  const counts: Record<SourceKind, number> = {
    [SourceKind.SearchIndex]: 0,
    [SourceKind.AzureBlob]: 0,
    [SourceKind.Web]: 0,
    [SourceKind.IndexedOneLake]: 0,
    [SourceKind.RemoteSharePoint]: 0,
    [SourceKind.IndexedSharePoint]: 0
  }
  if (!details) return counts
  for (const d of details) {
    if (counts[d.kind] !== undefined) counts[d.kind]++
  }
  return counts
}

/**
 * Runtime Properties Configuration for Knowledge Sources
 * Based on Azure AI Search Knowledge Agents API (2025-11-01-Preview)
 */

export type KnowledgeSourceKind = SourceKind | 'mcpTool' | 'unknown'

export type PropertyType = 'boolean' | 'number' | 'string' | 'headers'

export interface PropertyConfig {
  name: string
  label: string
  description: string
  type: PropertyType
  defaultValue?: any
  min?: number
  max?: number
  step?: number
  placeholder?: string
  required?: boolean
}

/**
 * Base runtime properties available for ALL knowledge source kinds
 * Based on Azure AI Search Knowledge Agents API (2025-11-01-preview swagger)
 */
const baseProperties: PropertyConfig[] = [
  {
    name: 'alwaysQuerySource',
    label: 'Always Query Source',
    description: 'Query this source for every request',
    type: 'boolean',
    defaultValue: false
  },
  {
    name: 'includeReferences',
    label: 'Include References',
    description: 'Return reference citations in the response',
    type: 'boolean',
    defaultValue: true
  },
  {
    name: 'includeReferenceSourceData',
    label: 'Include Source Data',
    description: 'Return full source snippets with references',
    type: 'boolean',
    defaultValue: false
  },
  {
    name: 'rerankerThreshold',
    label: 'Reranker Threshold',
    description: 'Minimum reranker score for results (0.0-4.0)',
    type: 'number',
    min: 0,
    max: 4,
    step: 0.1,
    placeholder: '0.5'
  }
]

/**
 * Search Index specific properties
 */
const searchIndexProperties: PropertyConfig[] = [
  {
    name: 'filterAddOn',
    label: 'Filter Add-On',
    description: 'OData filter expression to apply to search queries',
    type: 'string',
    placeholder: "category eq 'technical'"
  }
]

/**
 * Remote SharePoint specific properties
 */
const remoteSharePointProperties: PropertyConfig[] = [
  {
    name: 'filterExpressionAddOn',
    label: 'Filter Expression Add-On',
    description: 'Filter expression to apply to SharePoint queries',
    type: 'string',
    placeholder: "contentclass:STS_ListItem_DocumentLibrary"
  }
]

/**
 * Web specific properties
 */
const webProperties: PropertyConfig[] = [
  {
    name: 'language',
    label: 'Language',
    description: 'Language code for web search (e.g., en-US)',
    type: 'string',
    placeholder: 'en-US'
  },
  {
    name: 'market',
    label: 'Market',
    description: 'Market code for web search (e.g., en-US)',
    type: 'string',
    placeholder: 'en-US'
  },
  {
    name: 'count',
    label: 'Result Count',
    description: 'Number of web results to return',
    type: 'number',
    min: 1,
    max: 50,
    step: 1,
    placeholder: '10'
  },
  {
    name: 'freshness',
    label: 'Freshness',
    description: 'Time period for results (Day, Week, Month)',
    type: 'string',
    placeholder: 'Week'
  }
]

/**
 * Get runtime property configuration for a knowledge source kind
 * Returns base properties + kind-specific properties based on API spec
 */
export function getRuntimeProperties(kind: string): PropertyConfig[] {
  const properties = [...baseProperties]
  
  switch (kind.toLowerCase()) {
    case 'searchindex':
    case SourceKind.SearchIndex:
      return [...properties, ...searchIndexProperties]
    
    case 'remotesharepoint':
    case SourceKind.RemoteSharePoint:
      return [...properties, ...remoteSharePointProperties]
    
    case 'web':
    case SourceKind.Web:
      return [...properties, ...webProperties]
    
    case 'azureblob':
    case SourceKind.AzureBlob:
    case 'indexedsharepoint':
    case SourceKind.IndexedSharePoint:
    case 'indexedonelake':
    case SourceKind.IndexedOneLake:
      // These kinds only have base properties
      return properties
    
    case 'mcptool':
      // MCP tools have base properties + custom headers
      return properties
    
    default:
      // Unknown kinds get base properties
      return properties
  }
}

/**
 * Get header guidance based on knowledge source kind
 */
export function getHeaderGuidance(kind: string): {
  required: boolean
  headerName?: string
  placeholder?: string
  description: string
} {
  switch (kind) {
    case 'remoteSharePoint':
    case SourceKind.RemoteSharePoint:
      return {
        required: true,
        headerName: 'x-ms-query-source-authorization',
        placeholder: 'eyJ0eXAiOiJKV1QiLCJh...',
        description: 'Azure AD token with https://search.azure.com audience. Required for Remote SharePoint authentication.'
      }
    
    case 'indexedSharePoint':
    case SourceKind.IndexedSharePoint:
      return {
        required: false,
        headerName: 'x-ms-query-source-authorization',
        placeholder: 'eyJ0eXAiOiJKV1QiLCJh...',
        description: 'Azure AD token with https://search.azure.com audience. Optional - use for ACL-based access control.'
      }
    
    case 'mcpTool':
      return {
        required: true,
        headerName: 'Authorization',
        placeholder: 'MwcToken eyJ0eXAiOiJKV1QiLCJh...',
        description: 'MCP server authorization token. Format depends on MCP server requirements.'
      }
    
    default:
      return {
        required: false,
        description: 'Custom headers for authentication or special requirements'
      }
  }
}

/**
 * Validate property value based on its configuration
 */
export function validatePropertyValue(
  property: PropertyConfig,
  value: any
): { valid: boolean; error?: string } {
  if (property.required && (value === null || value === undefined || value === '')) {
    return { valid: false, error: `${property.label} is required` }
  }

  if (property.type === 'number' && value !== null && value !== undefined && value !== '') {
    const num = typeof value === 'number' ? value : parseFloat(value)
    
    if (isNaN(num)) {
      return { valid: false, error: `${property.label} must be a number` }
    }
    
    if (property.min !== undefined && num < property.min) {
      return { valid: false, error: `${property.label} must be at least ${property.min}` }
    }
    
    if (property.max !== undefined && num > property.max) {
      return { valid: false, error: `${property.label} must be at most ${property.max}` }
    }
  }

  return { valid: true }
}

/**
 * Get display name for a knowledge source kind
 */
export function getKindDisplayName(kind: string): string {
  if (kind === 'mcpTool') return 'MCP Tool'
  if (kind === 'unknown') return 'Unknown'
  
  // Try to find in SourceKind enum
  const normalized = kind.toLowerCase()
  const enumValues = Object.values(SourceKind)
  const matchedEnum = enumValues.find(ev => ev.toLowerCase() === normalized)
  
  if (matchedEnum) {
    return SOURCE_KIND_LABEL[matchedEnum as SourceKind]
  }
  
  // Fallback to capitalized kind name
  return kind.charAt(0).toUpperCase() + kind.slice(1)
}
