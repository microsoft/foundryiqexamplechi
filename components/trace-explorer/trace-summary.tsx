import { TraceSummary } from '@/lib/trace/transform'
import { formatElapsedTime, formatTokenCount } from '@/lib/trace/transform'
import { cn } from '@/lib/utils'

interface TraceSummaryProps {
  summary: TraceSummary
  className?: string
}

export function TraceSummaryBanner({ summary, className }: TraceSummaryProps) {
  return (
    <div className={cn('rounded-lg border border-stroke-divider bg-bg-subtle p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-fg-default">Session Overview</h3>
        <span className="text-xs text-fg-muted">Retrieval trace</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <StatCard
          label="ITERATIONS"
          value={summary.iterationCount.toString()}
          description="Distinct planning cycles executed."
        />
        <StatCard
          label="ACTIVITIES"
          value={summary.activitiesCount.toString()}
          description="Aggregate phases processed this run."
        />
        <StatCard
          label="RETRIEVAL CALLS"
          value={summary.totalResultsCount.toString()}
          description={`Across ${summary.uniqueSourcesCount} knowledge source${summary.uniqueSourcesCount !== 1 ? 's' : ''}.`}
        />
        <StatCard
          label="PLANNING TOKENS"
          value={formatTokenCount(summary.tokenUsage.queryPlanningOutputTokens)}
          description="Average output tokens per planning phase."
        />
        <StatCard
          label="ELAPSED (SUM)"
          value={formatElapsedTime(summary.totalElapsedMs)}
          description="Cumulative elapsed across all activities."
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="rounded-lg border border-stroke-divider bg-bg-card p-4 flex flex-col hover:border-accent/30 transition-colors">
      <span className="text-[10px] text-fg-muted uppercase tracking-wider mb-2">{label}</span>
      <span className="text-2xl font-bold text-fg-default mb-1.5">{value}</span>
      <span className="text-xs text-fg-muted leading-snug">{description}</span>
    </div>
  )
}
