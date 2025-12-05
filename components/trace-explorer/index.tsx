/**
 * Main Trace Explorer component that orchestrates all sub-components
 */

import { KnowledgeBaseRetrievalResponse } from '@/types/knowledge-retrieval'
import { transformKnowledgeRetrievalResponse } from '@/lib/trace/transform'
import { TraceSummaryBanner } from './trace-summary'
import { IterationTimeline } from './iteration-timeline'
import { AnswerPreview } from './answer-preview'
import { ReferencesGallery } from './references-gallery'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface TraceExplorerProps {
  response: KnowledgeBaseRetrievalResponse
  className?: string
}

export function TraceExplorer({ response, className }: TraceExplorerProps) {
  const trace = transformKnowledgeRetrievalResponse(response)
  const [highlightedRefId, setHighlightedRefId] = useState<string | null>(null)

  const handleCitationClick = (refId: string) => {
    setHighlightedRefId(refId)
    // Scroll to reference
    const element = document.getElementById(`ref-${refId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      // Flash highlight
      setTimeout(() => setHighlightedRefId(null), 2000)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Banner */}
      <TraceSummaryBanner summary={trace.summary} />

      {/* Query Decomposition & Fan-Out Timeline */}
      {trace.iterations.length > 0 && (
        <IterationTimeline iterations={trace.iterations} />
      )}

      {/* Answer Preview with Inline Citations */}
      {trace.answerText && (
        <AnswerPreview
          answerText={trace.answerText}
          references={trace.finalReferences}
          onCitationClick={handleCitationClick}
        />
      )}

      {/* Referenced Materials Gallery */}
      {trace.finalReferences.length > 0 && (
        <ReferencesGallery 
          references={trace.finalReferences}
          highlightedRefId={highlightedRefId || undefined}
          onReferenceClick={(refId) => {
            setHighlightedRefId(refId)
            setTimeout(() => setHighlightedRefId(null), 2000)
          }}
        />
      )}
    </div>
  )
}
