'use client'

import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Bot20Regular } from '@fluentui/react-icons'
import { motion } from 'framer-motion'

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Manage your Foundry agents and chat threads"
      />

      <div className="flex items-center justify-center min-h-[500px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <motion.div
                className="mx-auto w-20 h-20 rounded-full bg-accent-subtle/30 flex items-center justify-center"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Bot20Regular className="w-10 h-10 text-accent" />
              </motion.div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-fg-default">
                  Coming Soon
                </h3>
                <p className="text-fg-muted max-w-sm mx-auto">
                  The Agents feature is currently under development. We're working on bringing you an enhanced experience for managing and interacting with your Foundry agents.
                </p>
              </div>

              <motion.div
                className="pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="inline-flex items-center gap-2 text-sm text-fg-muted">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Check back soon for updates
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
