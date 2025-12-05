import { KnowledgeBaseReference } from '@/types/knowledge-retrieval'
import { getSourceTypeLabel } from '@/lib/trace/transform'
import { SourceKindIcon } from '@/components/source-kind-icon'
import { cn, cleanTextSnippet } from '@/lib/utils'

interface ReferencesGalleryProps {
  references: KnowledgeBaseReference[]
  className?: string
  highlightedRefId?: string
  onReferenceClick?: (refId: string) => void
}

export function ReferencesGallery({ references, className, highlightedRefId, onReferenceClick }: ReferencesGalleryProps) {
  if (references.length === 0) return null

  // Deduplicate by URL/docKey
  const uniqueRefs = Array.from(
    new Map(
      references.map(ref => {
        const key = (ref as any).blobUrl || (ref as any).url || (ref as any).docUrl || (ref as any).docKey || ref.id
        return [key, ref]
      })
    ).values()
  )

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-semibold text-fg-default">Referenced Materials</h3>
      
      <div className="grid grid-cols-1 gap-3">
        {uniqueRefs.map((ref, idx) => (
          <ReferenceCard 
            key={`${ref.id}-${idx}`} 
            reference={ref} 
            index={idx}
            isHighlighted={highlightedRefId === ref.id}
            onClick={onReferenceClick}
          />
        ))}
      </div>
    </div>
  )
}

function ReferenceCard({ reference, index, isHighlighted, onClick }: { 
  reference: KnowledgeBaseReference
  index: number
  isHighlighted?: boolean
  onClick?: (refId: string) => void
}) {
  const getDocumentName = (ref: KnowledgeBaseReference): string => {
    if ((ref as any).blobUrl) {
      return decodeURIComponent((ref as any).blobUrl.split('/').pop() || ref.id)
    }
    if ((ref as any).url) return (ref as any).url
    if ((ref as any).webUrl) return (ref as any).webUrl
    if ((ref as any).docUrl) return (ref as any).docUrl
    if ((ref as any).docKey) return (ref as any).docKey
    return ref.id
  }

  const getDocumentTitle = (ref: KnowledgeBaseReference): string => {
    if ((ref as any).title) return (ref as any).title
    return getDocumentName(ref)
  }

  const getSnippet = (ref: KnowledgeBaseReference): string | null => {
    if (!ref.sourceData) return null
    
    // Handle snippet field
    if (ref.sourceData.snippet) return ref.sourceData.snippet
    
    // Handle extracts array
    if (ref.sourceData.extracts && Array.isArray(ref.sourceData.extracts)) {
      return ref.sourceData.extracts.map((e: any) => e.text).join('\n\n')
    }
    
    return null
  }

  const docName = getDocumentName(reference)
  const docTitle = getDocumentTitle(reference)
  const snippet = getSnippet(reference)
  const typeLabel = getSourceTypeLabel(reference.type)

  return (
    <div 
      className={cn(
        "rounded-lg border bg-bg-card p-4 transition-all",
        isHighlighted 
          ? "border-accent shadow-lg ring-2 ring-accent/20" 
          : "border-stroke-divider hover:border-accent/40",
        onClick && "cursor-pointer"
      )}
      onClick={() => onClick?.(reference.id)}
      id={`ref-${reference.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-bg-subtle border border-stroke-divider text-xs font-mono text-fg-muted">
            Reference {index}
          </div>
          <SourceKindIcon kind={reference.type} size={14} variant="plain" className="flex-shrink-0" />
        </div>
        {reference.rerankerScore !== undefined && (
          <div className="text-xs font-mono text-fg-muted bg-bg-subtle px-2 py-1 rounded">
            {reference.rerankerScore.toFixed(3)}
          </div>
        )}
      </div>

      <div className="mb-2">
        <div className="text-sm font-medium text-fg-default truncate" title={docTitle}>
          {docTitle}
        </div>
        <div className="text-xs text-fg-muted">Linked activity: Activity #{reference.activitySource}</div>
      </div>

      {/* Web URL as clickable link */}
      {reference.type === 'web' && (reference as any).url && (
        <a
          href={(reference as any).url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline block mb-3 break-all"
        >
          {(reference as any).url}
        </a>
      )}

      {/* Sensitivity label for SharePoint */}
      {reference.type === 'remoteSharePoint' && (reference as any).searchSensitivityLabelInfo && (
        <div className="mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium"
            style={{
              backgroundColor: `${(reference as any).searchSensitivityLabelInfo.color}20`,
              color: (reference as any).searchSensitivityLabelInfo.color,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: `${(reference as any).searchSensitivityLabelInfo.color}40`
            }}
            title={(reference as any).searchSensitivityLabelInfo.tooltip}
          >
            {(reference as any).searchSensitivityLabelInfo.isEncrypted && (
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1C6.34 1 5 2.34 5 4v2H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1h-1V4c0-1.66-1.34-3-3-3zm0 1c1.11 0 2 .89 2 2v2H6V4c0-1.11.89-2 2-2z"/>
              </svg>
            )}
            {(reference as any).searchSensitivityLabelInfo.displayName}
          </span>
        </div>
      )}

      {/* Source snippet */}
      {snippet && (
        <div className="pt-3 border-t border-stroke-divider mt-3">
          <button
            type="button"
            className="text-[10px] font-medium text-fg-muted uppercase tracking-wide hover:text-fg-default mb-2 transition-colors"
          >
            View snippet
          </button>
          <div className="text-xs text-fg-muted bg-bg-subtle border border-stroke-divider rounded p-3 max-h-48 overflow-y-auto leading-relaxed">
            {cleanTextSnippet(snippet)}
          </div>
        </div>
      )}
    </div>
  )
}
