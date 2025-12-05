import * as React from 'react'
import { Play20Regular, Settings20Regular, MoreHorizontal20Regular } from '@fluentui/react-icons'
import { AgentAvatar } from '@/components/agent-avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import { StatusPill } from '@/components/shared/status-pill'
// Removed source kind icon rendering per request (no '?' placeholders)

type KnowledgeAgent = {
  id: string
  name: string
  model?: string
  sources: string[]
  sourceDetails?: { name: string; kind: string }[]
  status?: string
  lastRun?: string
  createdBy?: string
}

interface KnowledgeAgentCardProps {
  agent: KnowledgeAgent
}

const statusConfig = {
  active: { label: 'Active', variant: 'success' as const },
  idle: { label: 'Idle', variant: 'neutral' as const },
  error: { label: 'Error', variant: 'danger' as const },
}

export function KnowledgeAgentCard({ agent }: KnowledgeAgentCardProps) {
  const status = statusConfig[agent.status as keyof typeof statusConfig] || statusConfig.idle

  // Agents use name as ID, so ensure we have at least a name
  if (!agent.name) {
    return null
  }

  return (
    <Card className="transition-shadow duration-base ease-out hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <AgentAvatar size={40} iconSize={20} variant="subtle" title={agent.name} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold tracking-tight text-fg-default">
                {agent.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                {agent.model && (
                  <span className="rounded-full border border-glass-border bg-glass-surface px-2 py-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
                    {agent.model}
                  </span>
                )}
                <StatusPill variant={status.variant}>{status.label}</StatusPill>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/knowledge-bases/${agent.id || agent.name}`}>
                <Settings20Regular className="h-4 w-4" />
                <span className="sr-only">Edit agent</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal20Regular className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-0">
        {/* Sources */}
        {agent.sources?.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Knowledge sources</div>
            <div className="flex flex-wrap gap-2">
              {(agent.sourceDetails ? agent.sourceDetails.map(sd => sd.name) : agent.sources)
                .slice(0,3)
                .map((name, index) => (
                  <span key={index} className="inline-flex items-center rounded-full border border-glass-border bg-glass-surface px-2.5 py-1 text-xs font-medium text-fg-muted">
                    {name}
                  </span>
                ))}
              {agent.sources.length > 3 && (
                <span className="inline-flex items-center rounded-full border border-glass-border bg-glass-surface px-2.5 py-1 text-xs font-medium text-fg-muted">
                  +{agent.sources.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-2 text-xs text-fg-subtle">
          <div>
            {agent.lastRun ? <>Last run {formatRelativeTime(agent.lastRun)}</> : 'Never run'}
            {agent.createdBy && <> • Created by {agent.createdBy}</>}
          </div>
          
          <Button size="sm" asChild>
            <Link href={`/playground?agent=${agent.id || agent.name}`}>
              <Play20Regular className="h-3 w-3 mr-2" />
              Try now
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}