import { stripInlineCitations, parseInlineCitations, KnowledgeBaseReference } from '@/types/knowledge-retrieval'
import { cn } from '@/lib/utils'

interface AnswerPreviewProps {
  answerText: string
  references: KnowledgeBaseReference[]
  className?: string
  onCitationClick?: (refId: string) => void
}

export function AnswerPreview({ answerText, references, className, onCitationClick }: AnswerPreviewProps) {
  if (!answerText) return null

  const citations = parseInlineCitations(answerText)
  const hasInlineCitations = citations.length > 0

  // If no inline citations, just show clean text
  if (!hasInlineCitations) {
    return (
      <div className={cn('space-y-2', className)}>
        <h3 className="text-sm font-semibold text-fg-default">Answer</h3>
        <div className="rounded-lg border border-stroke-divider bg-bg-card p-4">
          <div className="prose prose-sm max-w-none text-fg-default whitespace-pre-wrap">
            {answerText}
          </div>
        </div>
      </div>
    )
  }

  // Parse text with citations
  const segments: Array<{ text: string; citations: string[] }> = []
  let lastIndex = 0

  // Group consecutive citations
  const groupedCitations: Array<{ startIndex: number; endIndex: number; refIds: string[] }> = []
  let currentGroup: { startIndex: number; endIndex: number; refIds: string[] } | null = null

  citations.forEach((citation) => {
    if (!currentGroup || citation.startIndex !== currentGroup.endIndex) {
      if (currentGroup) groupedCitations.push(currentGroup)
      currentGroup = {
        startIndex: citation.startIndex,
        endIndex: citation.endIndex,
        refIds: [citation.refId]
      }
    } else {
      currentGroup.endIndex = citation.endIndex
      currentGroup.refIds.push(citation.refId)
    }
  })
  if (currentGroup) groupedCitations.push(currentGroup)

  groupedCitations.forEach((group) => {
    // Add text before citation
    if (group.startIndex > lastIndex) {
      segments.push({
        text: answerText.substring(lastIndex, group.startIndex),
        citations: []
      })
    }

    // Add citation marker
    segments.push({
      text: '', // No visible text, just citation badge
      citations: group.refIds
    })

    lastIndex = group.endIndex
  })

  // Add remaining text
  if (lastIndex < answerText.length) {
    segments.push({
      text: answerText.substring(lastIndex),
      citations: []
    })
  }

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-semibold text-fg-default">Answer</h3>
      <div className="rounded-lg border border-stroke-divider bg-bg-card p-4">
        <div className="prose prose-sm max-w-none text-fg-default">
          {segments.map((segment, idx) => (
            <span key={idx}>
              {segment.text}
              {segment.citations.length > 0 && (
                <span className="inline-flex gap-0.5 ml-0.5">
                  {segment.citations.map((refId) => {
                    const ref = references.find(r => r.id === refId)
                    if (!ref) return null
                    
                    return (
                      <button
                        key={refId}
                        onClick={() => onCitationClick?.(refId)}
                        className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold text-accent bg-accent-subtle rounded hover:bg-accent hover:text-white transition-colors cursor-pointer"
                        title={`Reference ${parseInt(refId) + 1}`}
                      >
                        {parseInt(refId) + 1}
                      </button>
                    )
                  })}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
