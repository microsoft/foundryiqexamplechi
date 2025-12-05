'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Info20Regular, ChevronDown20Regular, ChevronUp20Regular } from '@fluentui/react-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { FormFrame } from '@/components/shared/form-frame'
import { Tooltip } from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { createKnowledgeBase } from '@/lib/api'
import { createKnowledgeBaseSchema, CreateKnowledgeBaseFormData } from '@/lib/validations'
import { getSourceKindLabel } from '@/lib/sourceKinds'
import { MODEL_DEPLOYMENTS } from '@/lib/modelOptions'

interface KnowledgeSourceSummary {
  id?: string
  name: string
  kind: string
}

interface CreateKnowledgeBaseFormProps {
  knowledgeSources: KnowledgeSourceSummary[]
  onSubmit?: (data: CreateKnowledgeBaseFormData) => Promise<void>
  onCancel: () => void
  className?: string
}

export function CreateKnowledgeBaseForm({
  knowledgeSources,
  onSubmit,
  onCancel,
  className,
}: CreateKnowledgeBaseFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedSources, setSelectedSources] = React.useState<string[]>([])
  // Advanced retrieval configuration removed per spec simplification
  const { toast } = useToast()

  // Check if any selected sources are "web" kind
  const hasWebSource = React.useMemo(() => {
    return selectedSources.some(sourceName => {
      const source = knowledgeSources.find(s => s.name === sourceName)
      return source?.kind?.toLowerCase() === 'web'
    })
  }, [selectedSources, knowledgeSources])

  const form = useForm<z.infer<typeof createKnowledgeBaseSchema>>({
    resolver: zodResolver(createKnowledgeBaseSchema),
    defaultValues: {
      name: '',
      description: '',
  modelDeployment: 'gpt-4o-mini', // default selection
      sources: [],
      outputModality: 'extractiveData',
      answerInstructions: '',
      retrievalInstructions: '',
  // Advanced retrieval flags removed
    },
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = form
  const watchedOutputModality = watch('outputModality')
  const watchedModel = watch('modelDeployment')

  // Enforce web source constraints
  React.useEffect(() => {
    if (hasWebSource) {
      // Web sources require Answer Synthesis mode
      if (watchedOutputModality !== 'answerSynthesis') {
        setValue('outputModality', 'answerSynthesis')
        toast({
          type: 'warning',
          title: 'Output mode changed',
          description: 'Web sources require Answer Synthesis mode.'
        })
      }
    }
  }, [hasWebSource, watchedOutputModality, setValue, toast])

  const toggleSource = (sourceName: string) => {
    setSelectedSources(prev => {
      const updated = prev.includes(sourceName)
        ? prev.filter(name => name !== sourceName)
        : [...prev, sourceName]
      setValue('sources', updated, { shouldValidate: true })
      return updated
    })
  }

  const handleFormSubmit = async (data: CreateKnowledgeBaseFormData) => {
    try {
      setIsSubmitting(true)

      const knowledgeSourcesPayload = selectedSources.map(name => ({ name }))

      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        retrievalInstructions: data.retrievalInstructions?.trim() || undefined,
        models: [
          {
            kind: 'azureOpenAI',
            azureOpenAIParameters: {
              resourceUri: process.env.NEXT_PUBLIC_FOUNDRY_ENDPOINT || '',
              deploymentId: data.modelDeployment,
              modelName: data.modelDeployment,
            },
          },
        ],
        knowledgeSources: knowledgeSourcesPayload,
        outputMode: data.outputModality,
        answerInstructions:
          data.outputModality === 'answerSynthesis'
            ? (data.answerInstructions?.trim() || undefined)
            : undefined,
      }

      await createKnowledgeBase(payload)

      if (onSubmit) {
        await onSubmit(data)
      }

      onCancel()
      toast({
        type: 'success',
        title: 'Knowledge base created',
        description: 'Your knowledge base is ready to use.',
      })
    } catch (error) {
      console.error('Failed to create knowledge base:', error)
      toast({
        type: 'error',
        title: 'Creation failed',
        description: error instanceof Error ? error.message : 'Failed to create knowledge base',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      <FormFrame
        title="Create knowledge base"
        description="Ground AI experiences with curated knowledge sources."
        actions={[
          {
            label: 'Cancel',
            onClick: onCancel,
            variant: 'ghost' as const,
          },
          {
            label: 'Create knowledge base',
            onClick: handleSubmit(handleFormSubmit),
            loading: isSubmitting,
            disabled: isSubmitting || selectedSources.length === 0,
          },
        ]}
      >
        <form className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic information</h3>

            <FormField name="name" error={errors.name?.message}>
              <div className="flex items-center gap-2">
                <FormLabel required>Knowledge base name</FormLabel>
                <Tooltip content="Choose a friendly name that reflects the knowledge this experience represents.">
                  <Info20Regular className="h-4 w-4 text-fg-muted cursor-help" />
                </Tooltip>
              </div>
              <FormControl>
                <Input
                  {...register('name')}
                  placeholder="e.g., Product Support KB"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  maxLength={64}
                />
              </FormControl>
              <FormDescription>
                A unique name for this knowledge base (max 64 characters).
              </FormDescription>
              <FormMessage />
            </FormField>

            <FormField name="description" error={errors.description?.message}>
              <div className="flex items-center gap-2">
                <FormLabel>Description</FormLabel>
                <Tooltip content="Explain what this knowledge base covers so other builders know when to use it.">
                  <Info20Regular className="h-4 w-4 text-fg-muted cursor-help" />
                </Tooltip>
              </div>
              <FormControl>
                <Textarea
                  {...register('description')}
                  placeholder="e.g., Official troubleshooting and how-to guidance for Contoso products"
                  rows={3}
                  maxLength={500}
                />
              </FormControl>
              <FormDescription>
                Optional description to help teammates understand the scope.
              </FormDescription>
              <FormMessage />
            </FormField>
          </div>

          {/* Model Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Model configuration</h3>

            <FormField name="modelDeployment" error={errors.modelDeployment?.message}>
              <div className="flex items-center gap-2">
                <FormLabel required>Azure OpenAI deployment</FormLabel>
                <Tooltip content="Select the Azure OpenAI deployment the knowledge base should use for grounded answers.">
                  <Info20Regular className="h-4 w-4 text-fg-muted cursor-help" />
                </Tooltip>
              </div>
              <FormControl>
                <Select
                  value={watchedModel || 'gpt-4o-mini'}
                  onValueChange={(value) => {
                    setValue('modelDeployment', value)
                    trigger('modelDeployment')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a deployment" />
                  </SelectTrigger>
                    <SelectContent>
                      {MODEL_DEPLOYMENTS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Pick the Azure OpenAI deployment to answer with grounded context.
              </FormDescription>
              <FormMessage />
            </FormField>

            <FormField name="outputModality" error={errors.outputModality?.message}>
              <div className="flex items-center gap-2">
                <FormLabel required>Output modality</FormLabel>
                <Tooltip content="Extractive data quotes directly from sources. Answer synthesis crafts new answers from the retrieved content.">
                  <Info20Regular className="h-4 w-4 text-fg-muted cursor-help" />
                </Tooltip>
              </div>
              <FormControl>
                <Select
                  value={watchedOutputModality || 'extractiveData'}
                  onValueChange={(value) => {
                    setValue('outputModality', value as 'extractiveData' | 'answerSynthesis')
                    trigger('outputModality')
                  }}
                  disabled={hasWebSource}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select output modality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="extractiveData">
                      <div>
                        <div className="font-medium">Extractive data</div>
                        <div className="text-xs text-fg-muted">Return verbatim snippets with citations</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="answerSynthesis">
                      <div>
                        <div className="font-medium">Answer synthesis</div>
                        <div className="text-xs text-fg-muted">Compose grounded answers with custom guidance</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                {hasWebSource ? (
                  <span className="text-status-warning">⚠️ Web sources require Answer Synthesis mode</span>
                ) : (
                  'Determine how responses are constructed from retrieved knowledge.'
                )}
              </FormDescription>
              <FormMessage />
            </FormField>

            {watchedOutputModality === 'answerSynthesis' && (
              <FormField name="answerInstructions" error={errors.answerInstructions?.message}>
                <div className="flex items-center gap-2">
                  <FormLabel>Answer instructions</FormLabel>
                  <Tooltip content="Guidance for formatting synthesized answers (only used in answer synthesis mode).">
                    <Info20Regular className="h-4 w-4 text-fg-muted cursor-help" />
                  </Tooltip>
                </div>
                <FormControl>
                  <Textarea
                    {...register('answerInstructions')}
                    placeholder="e.g., Start with a concise summary; use bullet points for lists; keep under 3 short paragraphs."
                    rows={3}
                    maxLength={500}
                  />
                </FormControl>
                <FormDescription>
                  Optional answer formatting guidance (max 500 chars; ignored unless using answer synthesis).
                </FormDescription>
                <FormMessage />
              </FormField>
            )}
          </div>

          {/* Knowledge Sources */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Knowledge sources</h3>
            <FormField name="sources" error={errors.sources?.message}>
              <div className="flex items-center gap-2">
                <FormLabel required>Select sources</FormLabel>
                <Tooltip content="Pick the indexes or repositories this knowledge base can access.">
                  <Info20Regular className="h-4 w-4 text-fg-muted cursor-help" />
                </Tooltip>
              </div>
              <FormControl>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-stroke-divider rounded-md p-3">
                  {knowledgeSources.length === 0 ? (
                    <div className="text-sm text-fg-muted text-center py-8">
                      <div className="mb-2">No knowledge sources available</div>
                      <div className="text-xs">
                        Connect knowledge sources before creating a knowledge base.
                      </div>
                    </div>
                  ) : (
                    knowledgeSources.map((source) => (
                      <label
                        key={source.name}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-bg-hover cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(source.name)}
                          onChange={() => toggleSource(source.name)}
                          className="rounded border-stroke-divider"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{source.name}</span>
                          <span className="text-xs text-fg-muted ml-2">({getSourceKindLabel(source.kind)})</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </FormControl>
              <FormDescription>
                The knowledge base will ground answers using these sources ({selectedSources.length} selected).
              </FormDescription>
              <FormMessage />
            </FormField>
          </div>

          {/* Retrieval Instructions (simplified) */}
          <div className="space-y-4 border-t border-stroke-divider pt-4">
            <FormField name="retrievalInstructions" error={errors.retrievalInstructions?.message}>
              <div className="flex items-center gap-2">
                <FormLabel>Retrieval instructions</FormLabel>
                <Tooltip content="Hints for how to prioritize and search sources (applies to all modalities).">
                  <Info20Regular className="h-4 w-4 text-fg-muted cursor-help" />
                </Tooltip>
              </div>
              <FormControl>
                <Textarea
                  {...register('retrievalInstructions')}
                  placeholder="e.g., Prefer latest official docs; use pricing index for cost queries; ignore archived community posts."
                  rows={3}
                  maxLength={500}
                />
              </FormControl>
              <FormDescription>
                Optional retrieval guidance (max 500 chars).
              </FormDescription>
              <FormMessage />
            </FormField>
          </div>
        </form>
      </FormFrame>
    </div>
  )
}
