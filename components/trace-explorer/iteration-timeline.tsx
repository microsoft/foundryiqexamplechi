import { TraceIteration } from '@/lib/trace/transform'
import { getPhaseInfo, formatElapsedTime, formatTokenCount } from '@/lib/trace/transform'
import { SourceKindIcon } from '@/components/source-kind-icon'
import { cn } from '@/lib/utils'
import { isRetrievalActivity } from '@/types/knowledge-retrieval'

interface IterationTimelineProps {
  iterations: TraceIteration[]
  className?: string
}

export function IterationTimeline({ iterations, className }: IterationTimelineProps) {
  if (iterations.length === 0) return null

  return (
    <div className={cn('space-y-6', className)}>
      {iterations.map((iteration, idx) => (
        <div
          key={iteration.id}
          className="rounded-lg border border-stroke-divider bg-bg-card p-4"
        >
          {/* Iteration Header with Badge */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stroke-divider">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 border border-accent/40">
              <span className="text-sm font-bold text-accent">{idx + 1}</span>
            </div>
            <h4 className="text-sm font-semibold text-fg-default">Iteration {idx + 1}</h4>
            <div className="flex gap-2 ml-auto">
              {iteration.planningActivity && <PhaseBadge label="Query Planning" tone="planning" />}
              {iteration.retrievalActivities.length > 0 && <PhaseBadge label="Retrieval" tone="retrieval" />}
              {iteration.reasoningActivity && <PhaseBadge label="Assessment" tone="assessment" />}
              {iteration.synthesisActivity && <PhaseBadge label="Synthesis" tone="synthesis" />}
            </div>
          </div>

          <div className="space-y-4">
            {/* Planning Phase */}
            {iteration.planningActivity && (
              <PhaseCard
                type={iteration.planningActivity.type}
                elapsedMs={iteration.planningActivity.elapsedMs}
                tokens={(iteration.planningActivity as any).inputTokens + (iteration.planningActivity as any).outputTokens}
              />
            )}

            {/* Retrieval Phase */}
            {iteration.retrievalActivities.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-fg-muted uppercase tracking-wide">
                  Retrieval
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {iteration.retrievalActivities.map((activity) => {
                    if (!isRetrievalActivity(activity)) return null
                    
                    const query = 
                      (activity as any).searchIndexArguments?.search ||
                      (activity as any).azureBlobArguments?.search ||
                      (activity as any).remoteSharePointArguments?.search ||
                      (activity as any).webArguments?.search ||
                      (activity as any).indexedOneLakeArguments?.search ||
                      ''

                    return (
                      <RetrievalCard
                        key={activity.id}
                        type={activity.type}
                        sourceName={activity.knowledgeSourceName}
                        query={query}
                        resultCount={activity.count}
                        elapsedMs={activity.elapsedMs}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Reasoning Phase */}
            {iteration.reasoningActivity && (
              <PhaseCard
                type={iteration.reasoningActivity.type}
                elapsedMs={iteration.reasoningActivity.elapsedMs}
                tokens={(iteration.reasoningActivity as any).reasoningTokens}
                effort={(iteration.reasoningActivity as any).retrievalReasoningEffort?.kind}
              />
            )}

            {/* Synthesis Phase */}
            {iteration.synthesisActivity && (
              <PhaseCard
                type={iteration.synthesisActivity.type}
                elapsedMs={iteration.synthesisActivity.elapsedMs}
                tokens={(iteration.synthesisActivity as any).inputTokens + (iteration.synthesisActivity as any).outputTokens}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function PhaseBadge({ label, tone }: { label: string; tone: string }) {
  const toneColors: Record<string, string> = {
    planning: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
    retrieval: 'bg-purple-500/10 border-purple-500/30 text-purple-600',
    assessment: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
    synthesis: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
  }

  return (
    <span className={cn('px-2 py-1 rounded text-[10px] font-medium border', toneColors[tone])}>
      {label}
    </span>
  )
}

function PhaseCard({ type, elapsedMs, tokens, effort }: { 
  type: string
  elapsedMs?: number
  tokens?: number
  effort?: string
}) {
  const phase = getPhaseInfo(type)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-fg-default uppercase tracking-wide">{phase.label}</div>
        <div className="flex items-center gap-3 text-xs text-fg-muted">
          {tokens !== undefined && tokens > 0 && (
            <div className="font-mono">{formatTokenCount(tokens)}</div>
          )}
          {elapsedMs !== undefined && (
            <div className="font-mono">{formatElapsedTime(elapsedMs)}</div>
          )}
        </div>
      </div>
      <div className="text-xs text-fg-muted">{phase.description}</div>
      {effort && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-fg-muted">Effort:</span>
          <span className="px-2 py-0.5 rounded bg-bg-subtle border border-stroke-divider text-fg-default font-medium">
            {effort}
          </span>
        </div>
      )}
    </div>
  )
}

function RetrievalCard({ type, sourceName, query, resultCount, elapsedMs }: {
  type: string
  sourceName: string
  query: string
  resultCount: number
  elapsedMs?: number
}) {
  return (
    <div className="rounded border border-stroke-divider bg-bg-subtle p-3">
      <div className="flex items-start gap-3">
        <SourceKindIcon kind={type} size={16} variant="plain" className="mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-sm font-medium text-fg-default truncate">{sourceName}</span>
            <span className="text-xs text-fg-muted whitespace-nowrap">
              {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </span>
          </div>
          {query && (
            <div className="text-xs text-fg-muted mb-1">
              <span className="font-medium">Query:</span> <span className="italic">"{query}"</span>
            </div>
          )}
          {elapsedMs !== undefined && (
            <span className="text-[10px] font-mono text-fg-muted">{formatElapsedTime(elapsedMs)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
