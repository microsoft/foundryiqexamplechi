'use client'

import { useState, useEffect, useRef } from 'react'
import { Send20Regular, Bot20Regular, Person20Regular, ChevronDown20Regular, ChevronUp20Regular, Settings20Regular, Dismiss20Regular, Delete20Regular, Attach20Regular, Mic20Regular, Image20Regular, ChatAdd20Regular, Code20Regular, ArrowCounterclockwise20Regular } from '@fluentui/react-icons'
import { AgentAvatar } from '@/components/agent-avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { VoiceInput } from '@/components/ui/voice-input'
import { ImageInput } from '@/components/ui/image-input'
import { InlineCitationsText } from '@/components/inline-citations'
import { SourceKindIcon } from '@/components/source-kind-icon'
import { MCPToolCallDisplay } from '@/components/mcp-tool-call-display'
import { RuntimeSettingsPanel } from '@/components/runtime-settings-panel'
import { fetchKnowledgeBases, fetchKnowledgeSources, retrieveFromKnowledgeBase } from '../lib/api'
import { KBViewCodeModal } from '@/components/kb-view-code-modal'
import { processImageFile } from '@/lib/imageProcessing'
import { useConversationStarters } from '@/lib/conversationStarters'
import { cn, formatRelativeTime, cleanTextSnippet } from '@/lib/utils'
import { TraceExplorer } from '@/components/trace-explorer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type KnowledgeAgent = {
  id: string
  name: string
  model?: string
  sources: string[]
  status?: string
  description?: string
  outputConfiguration?: { modality?: string; answerInstructions?: string }
  outputMode?: 'answerSynthesis' | 'extractiveData'
  answerInstructions?: string  // Can be at root level in API response
  retrievalReasoningEffort?: { kind: 'minimal' | 'low' | 'medium' | 'high' }
  retrievalInstructions?: string
  knowledgeSources?: Array<{
    name: string
    kind?: string
    includeReferences?: boolean
    includeReferenceSourceData?: boolean | null
    alwaysQuerySource?: boolean | null
    maxSubQueries?: number | null
    rerankerThreshold?: number | null
    headers?: Record<string, string>
  }>
}

type MessageContent = 
  | { type: 'text'; text: string }
  | { type: 'image'; image: { url: string; file?: File } }

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: MessageContent[]
  timestamp: Date
  references?: Reference[]
  activity?: Activity[]
}

type Reference = {
  type: string
  id: string
  activitySource: number
  sourceData?: any
  rerankerScore?: number
  docKey?: string
  blobUrl?: string
  toolName?: string
  serverURL?: string
  content?: string
  searchSensitivityLabelInfo?: {
    displayName: string
    sensitivityLabelId: string
    tooltip: string
    priority: number
    color: string
    isEncrypted: boolean
  }
  webUrl?: string
}

type Activity = {
  type: string
  id: number
  inputTokens?: number
  outputTokens?: number
  elapsedMs?: number
  knowledgeSourceName?: string
  queryTime?: string
  count?: number
  searchIndexArguments?: any
  azureBlobArguments?: any
  remoteSharePointArguments?: {
    search?: string
    filterExpressionAddOn?: string | null
  }
  webArguments?: {
    search?: string
    language?: string | null
    market?: string | null
    count?: number | null
    freshness?: string | null
  }
}

interface KBPlaygroundViewProps {
  preselectedAgent?: string
}

export function KBPlaygroundView({ preselectedAgent }: KBPlaygroundViewProps) {
  const [agents, setAgents] = useState<KnowledgeAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<KnowledgeAgent | null>(null)
  const [agentsLoading, setAgentsLoading] = useState<boolean>(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [images, setImages] = useState<Array<{ id: string; dataUrl: string; status: 'processing' | 'ready' }>>([])
  const [imageWarning, setImageWarning] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [viewCodeOpen, setViewCodeOpen] = useState(false)
  const [showCostEstimates, setShowCostEstimates] = useState(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showCostEstimates')
      return saved !== null ? saved === 'true' : false // Default to hidden
    }
    return false
  })
  const [runtimeSettings, setRuntimeSettings] = useState<{
    outputMode?: 'answerSynthesis' | 'extractiveData'
    reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
    globalHeaders?: Record<string, string>
    answerInstructions?: string
    retrievalInstructions?: string
    knowledgeSourceParams: Array<{
      knowledgeSourceName: string
      kind: string
      alwaysQuerySource?: boolean
      includeReferences?: boolean
      includeReferenceSourceData?: boolean
      rerankerThreshold?: number | null
      maxSubQueries?: number | null
      headers?: Record<string, string>
    }>
  }>({
    outputMode: 'answerSynthesis',
    reasoningEffort: 'low',
    globalHeaders: {},
    answerInstructions: '',
    retrievalInstructions: '',
    knowledgeSourceParams: []
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get search endpoint from env
  const searchEndpoint = process.env.NEXT_PUBLIC_SEARCH_ENDPOINT || process.env.NEXT_PUBLIC_AZURE_SEARCH_ENDPOINT || ''

  // Save cost display preference
  const toggleCostEstimates = () => {
    const newValue = !showCostEstimates
    setShowCostEstimates(newValue)
    if (typeof window !== 'undefined') {
      localStorage.setItem('showCostEstimates', newValue.toString())
    }
  }

  // Load agents
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setAgentsLoading(true)
          // Fetch both knowledge bases and knowledge sources
          const [kbData, ksData] = await Promise.all([
            fetchKnowledgeBases(),
            fetchKnowledgeSources()
          ])

          // Create a mapping of knowledge source name → kind
          const ksKindMap = new Map<string, string>()
          ksData.value?.forEach((ks: any) => {
            if (ks.name && ks.kind) {
              ksKindMap.set(ks.name, ks.kind)
            }
          })

          const data = kbData
        const rawAgents = data.value || []

        const agentsList = rawAgents.map(agent => ({
          id: agent.name,
          name: agent.name,
          model: agent.models?.[0]?.azureOpenAIParameters?.modelName,
            sources: (agent.knowledgeSources || []).map((ks: any) => ks.name),
          status: 'active',
          description: agent.description,
          outputConfiguration: agent.outputConfiguration,
          outputMode: agent.outputMode,
          answerInstructions: agent.answerInstructions,
          retrievalReasoningEffort: agent.retrievalReasoningEffort,
          retrievalInstructions: agent.retrievalInstructions,
            // Enrich knowledge sources with actual kind values from API
            knowledgeSources: (agent.knowledgeSources || []).map((ks: any) => ({
              ...ks,
              kind: ksKindMap.get(ks.name) || ks.kind // Use API kind or existing kind
            }))
        }))

        setAgents(agentsList)

        // Auto-select agent based on preselectedAgent prop or first agent
        if (agentsList.length > 0) {
          let agentToSelect = agentsList[0]

          // If preselectedAgent is provided, try to find it
          if (preselectedAgent) {
            const foundAgent = agentsList.find(a => a.id === preselectedAgent || a.name === preselectedAgent)
            if (foundAgent) {
              agentToSelect = foundAgent
            }
          }

          setSelectedAgent(agentToSelect)
          
          // Initialize runtime settings from the selected knowledge base defaults
          const reasoningEffort = agentToSelect.retrievalReasoningEffort?.kind || 'low'
          
          // Determine output mode from either outputMode or outputConfiguration.modality
          const outputMode = agentToSelect.outputMode || 
                            (agentToSelect.outputConfiguration?.modality as 'answerSynthesis' | 'extractiveData') || 
                            'answerSynthesis'
          
          setRuntimeSettings({
            outputMode: outputMode,
            reasoningEffort: reasoningEffort,
            globalHeaders: {},
            answerInstructions: agentToSelect.answerInstructions || agentToSelect.outputConfiguration?.answerInstructions || '',
            retrievalInstructions: agentToSelect.retrievalInstructions || '',
            knowledgeSourceParams: []
          })
          
          // Start fresh - no chat history persistence
          // loadChatHistory(agentToSelect.id)
        }
      } catch (err) {
        console.error('Failed to load agents:', err)
      } finally {
        setAgentsLoading(false)
      }
    }

    loadAgents()
  }, [preselectedAgent])

  // Watch for preselectedAgent changes and update selection
  useEffect(() => {
    if (preselectedAgent && agents.length > 0) {
      const foundAgent = agents.find(a => a.id === preselectedAgent || a.name === preselectedAgent)
      if (foundAgent && foundAgent.id !== selectedAgent?.id) {
        setSelectedAgent(foundAgent)
        setMessages([]) // Clear messages when switching agents
        
        // Use the retrievalReasoningEffort.kind directly from the knowledge base
        const reasoningEffort = foundAgent.retrievalReasoningEffort?.kind || 'low'
        
        // Determine output mode from either outputMode or outputConfiguration.modality
        const outputMode = foundAgent.outputMode || 
                          (foundAgent.outputConfiguration?.modality as 'answerSynthesis' | 'extractiveData') || 
                          'answerSynthesis'
        
        setRuntimeSettings({ // Apply knowledge base defaults when switching agents
          outputMode: outputMode,
          reasoningEffort: reasoningEffort,
          globalHeaders: {},
          answerInstructions: foundAgent.answerInstructions || foundAgent.outputConfiguration?.answerInstructions || '',
          retrievalInstructions: foundAgent.retrievalInstructions || '',
          knowledgeSourceParams: []
        })
      }
    }
  }, [preselectedAgent, agents])

  // Chat history persistence DISABLED - always start fresh
  // const loadChatHistory = (agentId: string) => {
  //   try {
  //     const stored = localStorage.getItem(`kb-playground-${agentId}`)
  //     if (stored) {
  //       const parsed = JSON.parse(stored)
  //       const messagesWithDates = parsed.map((msg: any) => ({
  //         ...msg,
  //         timestamp: new Date(msg.timestamp)
  //       }))
  //       setMessages(messagesWithDates)
  //     } else {
  //       setMessages([])
  //     }
  //   } catch (err) {
  //     console.error('Failed to load chat history:', err)
  //     setMessages([])
  //   }
  // }

  // const saveChatHistory = (agentId: string, msgs: Message[]) => {
  //   try {
  //     localStorage.setItem(`kb-playground-${agentId}`, JSON.stringify(msgs))
  //   } catch (err) {
  //     console.error('Failed to save chat history:', err)
  //   }
  // }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save messages when they change - DISABLED (no persistence)
  // useEffect(() => {
  //   if (selectedAgent && messages.length > 0) {
  //     saveChatHistory(selectedAgent.id, messages)
  //   }
  // }, [messages, selectedAgent])

  // Load conversation starters for the selected agent
  const { starters, isGeneralFallback: isGeneral } = useConversationStarters(selectedAgent?.id)

  // Voice input handler
  const handleVoiceInput = (transcript: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + transcript)
    textareaRef.current?.focus()
  }

  // Image input handler
  const handleImageSelect = async (imageUrl: string, file: File) => {
    if (images.length >= 1) { 
      setImageWarning('Only one image per query allowed')
      return 
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setImages([{ id, dataUrl: imageUrl, status: 'processing' }])
    try {
      const processed = await processImageFile(file, {
        maxLongSide: 2048,
        targetMinShortSide: 768,
        maxBytes: 4 * 1024 * 1024
      })
      setImages([{ id, dataUrl: processed.dataUrl, status: 'ready' }])
    } catch (err) {
      console.warn('Processing failed; converting to base64 fallback.', err)
      try {
        const reader = new FileReader()
        reader.onload = () => setImages([{ id, dataUrl: reader.result as string, status: 'ready' }])
        reader.onerror = () => setImages([])
        reader.readAsDataURL(file)
      } catch (inner) {
        console.error('Fallback failed; removing image.', inner)
        setImages([])
      }
    }
  }

  const handleImageRemove = (id: string) => {
    setImages(prev => prev.filter(img => {
      if (img.id === id && img.dataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(img.dataUrl)
      }
      return img.id !== id
    }))
    setImageWarning('')
  }

  const buildKnowledgeSourceParams = () => {
    const userOverrides = runtimeSettings.knowledgeSourceParams && runtimeSettings.knowledgeSourceParams.length > 0
      ? runtimeSettings.knowledgeSourceParams
      : null

    const baseParams = userOverrides || (selectedAgent?.knowledgeSources || []).map(ks => ({
      knowledgeSourceName: ks.name,
      kind: ks.kind,
      alwaysQuerySource: ks.alwaysQuerySource ?? undefined,
      includeReferences: ks.includeReferences ?? true,
      includeReferenceSourceData: ks.includeReferenceSourceData ?? true,
      rerankerThreshold: ks.rerankerThreshold ?? undefined,
      maxSubQueries: ks.maxSubQueries ?? undefined,
      headers: ks.headers
    }))

    if (!baseParams || baseParams.length === 0) {
      return undefined
    }

    return baseParams
      .map((param) => {
        const name = param.knowledgeSourceName || (param as any).name
        if (!name) {
          return null
        }

        const cleanedParam: any = {
          knowledgeSourceName: name,
          kind: param.kind || 'searchIndex'
        }

        if (param.alwaysQuerySource === true) cleanedParam.alwaysQuerySource = true
        cleanedParam.includeReferences = param.includeReferences !== false
        cleanedParam.includeReferenceSourceData = param.includeReferenceSourceData !== false

        if (typeof param.rerankerThreshold === 'number') cleanedParam.rerankerThreshold = param.rerankerThreshold
        if (typeof param.maxSubQueries === 'number') cleanedParam.maxSubQueries = param.maxSubQueries

        if (param.headers && Object.keys(param.headers).length > 0) {
          cleanedParam.headers = param.headers
        }

        return cleanedParam
      })
      .filter(Boolean)
  }

  const sendPrompt = async (prompt: string, imageUrl?: string) => {
    if (!selectedAgent || isLoading) return
    
    // If imageUrl is provided, load it and convert to base64
    const contentParts: MessageContent[] = []
    
    if (imageUrl) {
      try {
        // Fetch the image and convert to base64
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        contentParts.push({ type: 'image', image: { url: dataUrl } })
      } catch (error) {
        console.error('Failed to load image:', error)
      }
    }
    
    contentParts.push({ type: 'text', text: prompt })
    
    // Set input and submit immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: contentParts,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const convertContent = async (c: MessageContent) => {
        if (c.type === 'text') return { type: 'text', text: c.text }
        if (c.type === 'image') return { type: 'image', image: { url: c.image.url } }
        return c as any
      }

      const azureMessages = [
        ...await Promise.all(messages.map(async (m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: await Promise.all(m.content.map(convertContent))
        }))),
        {
          role: 'user' as const,
          content: await Promise.all(contentParts.map(convertContent))
        }
      ]

      // Transform runtime settings to match API expectations
      const apiParams: any = {}
      
      // Add global headers if present
      if (runtimeSettings.globalHeaders && Object.keys(runtimeSettings.globalHeaders).filter(k => k && runtimeSettings.globalHeaders![k]).length > 0) {
        apiParams.globalHeaders = runtimeSettings.globalHeaders
      }
      
      if (runtimeSettings.outputMode) {
        apiParams.outputMode = runtimeSettings.outputMode
      }
      
      if (runtimeSettings.reasoningEffort) {
        // Azure API expects an object with 'kind' property, not a string
        apiParams.retrievalReasoningEffort = {
          kind: runtimeSettings.reasoningEffort
        }
      }
      
      const knowledgeSourceParams = buildKnowledgeSourceParams()
      if (knowledgeSourceParams && knowledgeSourceParams.length > 0) {
        apiParams.knowledgeSourceParams = knowledgeSourceParams
      }


      // Determine if we should use intents instead of messages
      // When reasoning effort is 'minimal', use intents format
      const useIntentsFormat = runtimeSettings.reasoningEffort === 'minimal'
      
      let requestPayload: any
      
      if (useIntentsFormat) {
        // For minimal reasoning effort, extract just the text from the last user message
        // and format as intents
        requestPayload = {
          intents: [
            {
              type: 'semantic',
              search: prompt
            }
          ],
          ...apiParams
        }
        console.log('🔍 Using INTENTS format (minimal reasoning)')
      } else {
        // Standard messages format for medium/low/high reasoning
        requestPayload = {
          messages: azureMessages,
          ...apiParams
        }
        console.log('🔍 Using MESSAGES format (standard reasoning)')
      }

      // Debug logging - SEND PROMPT
      console.log('🔍 API Request Payload (sendPrompt):')
      console.log('Knowledge Base:', selectedAgent.id)
      console.log('Reasoning Effort:', runtimeSettings.reasoningEffort)
      console.log('Payload:', JSON.stringify(requestPayload, null, 2))

      const response = await retrieveFromKnowledgeBase(selectedAgent.id, useIntentsFormat ? null : azureMessages, useIntentsFormat ? requestPayload : apiParams)

      let assistantText = 'I apologize, but I was unable to generate a response.'
      if (response.response && response.response.length > 0) {
        const rc = response.response[0].content
        if (rc && rc.length > 0) assistantText = rc[0].text || assistantText
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: [{ type: 'text', text: assistantText }],
        timestamp: new Date(),
        references: response.references || [],
        activity: response.activity || []
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      // Enhanced error logging - SEND PROMPT
      console.error('❌ API Error (sendPrompt):', err)
      if (err && typeof err === 'object') {
        console.error('Error details:', JSON.stringify(err, null, 2))
      }
      
      // Extract meaningful error message
      let errorText = 'Error processing request. Please try again.'
      if (err instanceof Error) {
        errorText = `❌ Error: ${err.message}`
      } else if (typeof err === 'string') {
        errorText = `❌ Error: ${err}`
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: [{ type: 'text', text: errorText }],
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAgentChange = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (agent) {
      setSelectedAgent(agent)
      // Always start fresh - no history loading
      setMessages([])
      setRuntimeSettings({ knowledgeSourceParams: [] }) // Reset runtime settings
    }
  }

  const handleClearChat = () => {
    // Simply clear the messages array - no localStorage involvement
    setMessages([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && images.length === 0) || !selectedAgent || isLoading) return
    if (images.some(i => i.status === 'processing')) {
      setImageWarning('Please wait for image processing to finish')
      return
    }

    const contentParts: MessageContent[] = []
    for (const img of images) {
      contentParts.push({ type: 'image', image: { url: img.dataUrl } })
    }
    if (input.trim()) contentParts.push({ type: 'text', text: input })

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: contentParts,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setImages([])
    setImageWarning('')
    setIsLoading(true)

    try {
      const convertContent = async (c: MessageContent) => {
        if (c.type === 'text') return { type: 'text', text: c.text }
        if (c.type === 'image') return { type: 'image', image: { url: c.image.url } }
        return c as any
      }

      const azureMessages = [
        ...await Promise.all(messages.map(async (m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: await Promise.all(m.content.map(convertContent))
        }))),
        {
          role: 'user' as const,
          content: await Promise.all(contentParts.map(convertContent))
        }
      ]

      // Transform runtime settings to match API expectations
      const apiParams: any = {}
      
      // Add global headers if present
      if (runtimeSettings.globalHeaders && Object.keys(runtimeSettings.globalHeaders).filter(k => k && runtimeSettings.globalHeaders![k]).length > 0) {
        apiParams.globalHeaders = runtimeSettings.globalHeaders
      }
      
      if (runtimeSettings.outputMode) {
        apiParams.outputMode = runtimeSettings.outputMode
      }
      
      if (runtimeSettings.reasoningEffort) {
        // Azure API expects an object with 'kind' property, not a string
        apiParams.retrievalReasoningEffort = {
          kind: runtimeSettings.reasoningEffort
        }
      }
      
      const knowledgeSourceParamsSubmit = buildKnowledgeSourceParams()
      if (knowledgeSourceParamsSubmit && knowledgeSourceParamsSubmit.length > 0) {
        apiParams.knowledgeSourceParams = knowledgeSourceParamsSubmit
      }

      // Note: includeReferences and includeReferenceSourceData are set per-source in knowledgeSourceParams,
      // not as top-level parameters in the retrieve API (API version 2025-11-01-preview)

      // Debug logging - HANDLE SUBMIT
      console.log('🔍 API Request Payload (handleSubmit):')
      console.log('Knowledge Base:', selectedAgent.id)
      console.log('Messages:', JSON.stringify(azureMessages, null, 2))
      console.log('API Params:', JSON.stringify(apiParams, null, 2))

      const response = await retrieveFromKnowledgeBase(selectedAgent.id, azureMessages, apiParams)

      let assistantText = 'I apologize, but I was unable to generate a response.'
      if (response.response && response.response.length > 0) {
        const rc = response.response[0].content
        if (rc && rc.length > 0) assistantText = rc[0].text || assistantText
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: [{ type: 'text', text: assistantText }],
        timestamp: new Date(),
        references: response.references || [],
        activity: response.activity || []
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      // Enhanced error logging - HANDLE SUBMIT
      console.error('❌ API Error (handleSubmit):', err)
      if (err && typeof err === 'object') {
        console.error('Error details:', JSON.stringify(err, null, 2))
      }
      
      // Extract meaningful error message
      let errorText = 'Error processing request. Please try again.'
      if (err instanceof Error) {
        errorText = `❌ Error: ${err.message}`
      } else if (typeof err === 'string') {
        errorText = `❌ Error: ${err}`
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: [{ type: 'text', text: errorText }],
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  if (agentsLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="h-8 w-8 border-2 border-fg-muted border-t-transparent rounded-full animate-spin" aria-label="Loading agents" />
          </div>
          <p className="text-sm text-fg-muted">Loading knowledge bases…</p>
        </div>
      </div>
    )
  }

  if (!selectedAgent) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">No knowledge bases found</h2>
          <p className="text-fg-muted">Please create a knowledge base to start testing.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-stroke-divider p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <AgentAvatar size={44} iconSize={22} variant="subtle" title={selectedAgent.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-semibold text-xl truncate">Knowledge Base Playground</h1>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Select value={selectedAgent.id} onValueChange={handleAgentChange}>
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select a knowledge base" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-fg-muted">•</span>
                    <span className="text-sm text-fg-muted">{selectedAgent.sources.length} source{selectedAgent.sources.length !== 1 && 's'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewCodeOpen(true)}
                aria-label="View code"
                title="View code to reproduce this conversation"
              >
                <Code20Regular className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                disabled={messages.length === 0}
                aria-label="Reset chat"
                title="Reset conversation"
              >
                <ArrowCounterclockwise20Regular className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(!settingsOpen)}
                aria-label="Settings"
              >
                <Settings20Regular className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block mb-6">
                <AgentAvatar size={64} iconSize={32} variant="subtle" title={selectedAgent.name} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start testing your knowledge base</h3>
              <p className="text-fg-muted max-w-md mx-auto mb-3">
                Ask questions to test how your knowledge base retrieves and synthesizes information from your sources.
              </p>

              {/* Dynamic Conversation Starters */}
              {isGeneral ? (
                <div className="max-w-xl mx-auto mt-6">
                  <Card className="bg-bg-subtle border-dashed border-stroke-divider">
                    <CardContent className="p-6 text-left">
                      <div className="text-sm font-medium mb-2">No domain-specific starters yet</div>
                      <p className="text-xs text-fg-muted mb-4">Create or configure a knowledge base with domain sources to see tailored prompts here.</p>
                      <div className="space-y-2">
                        {["Summarize key themes across the most recent documents.", "What gaps or missing details should I clarify next?"].map((g, i) => (
                          <button
                            key={i}
                            onClick={() => sendPrompt(g)}
                            disabled={isLoading}
                            className="w-full text-left p-3 rounded-md bg-bg-card hover:bg-bg-hover transition text-xs border border-stroke-divider disabled:opacity-60"
                          >{g}</button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                  {starters.map((s, idx) => {
                    const requiresImage = s.prompt.toLowerCase().includes('upload') || s.imageUrl
                    const hasPreloadedImage = !!s.imageUrl
                    return (
                      <Card
                        key={idx}
                        className={cn('relative cursor-pointer hover:elevation-sm hover:scale-105 transition-all duration-150 bg-bg-card border border-stroke-divider active:scale-95')}
                        onClick={() => sendPrompt(s.prompt, s.imageUrl)}
                      >
                        <CardContent className="p-4 text-left space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-[11px] uppercase tracking-wide text-fg-muted font-medium">{s.complexity}</div>
                            <div className="flex items-center gap-1">
                              {requiresImage && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100/50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1">
                                  <Attach20Regular className="h-3 w-3" />
                                  Image
                                </span>
                              )}
                              {s.complexity === 'Advanced' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-subtle text-accent">Multi-source</span>}
                            </div>
                          </div>
                          <div className="text-sm font-medium leading-snug">{s.label}</div>
                          <p className="text-xs text-fg-muted leading-snug">{s.prompt}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} agent={selectedAgent} showCostEstimates={showCostEstimates} />
            ))
          )}

          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-accent-subtle">
                <Bot20Regular className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-stroke-divider p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image thumbnails */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {images.map(img => (
                  <div key={img.id} className="relative">
                    <img
                      src={img.dataUrl}
                      alt="attachment"
                      className={cn('h-20 w-20 object-cover rounded border border-stroke-divider', img.status==='processing' && 'opacity-60 animate-pulse')}
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(img.id)}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-bg-card border border-stroke-divider flex items-center justify-center text-fg-muted hover:text-fg-default"
                      aria-label="Remove image"
                    >
                      <Dismiss20Regular className="h-3 w-3" />
                    </button>
                    {img.status === 'processing' && (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-fg-muted bg-bg-card/40 backdrop-blur-sm rounded">…</div>
                    )}
                  </div>
                ))}
                {imageWarning && (
                  <div className="text-[10px] text-status-warning font-medium self-end pb-1">{imageWarning}</div>
                )}
              </div>
            )}

            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question to test your knowledge base..."
                className="min-h-[60px] max-h-[200px] resize-none pr-32"
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-3 flex gap-1">
                <VoiceInput
                  onTranscript={handleVoiceInput}
                  disabled={isLoading}
                />
                <ImageInput
                  onImageSelect={handleImageSelect}
                  disabled={isLoading || images.length >= 1}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8"
                  disabled={(!input.trim() && images.length === 0) || isLoading || images.some(i => i.status==='processing')}
                >
                  <Send20Regular className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-fg-muted">
              Press Enter to send, Shift+Enter for new line. Click mic for voice input or image icon to add an image.
            </p>
          </form>
        </div>
      </div>

      {/* Right Drawer - Settings Panel */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="border-l border-stroke-divider bg-bg-card overflow-hidden"
          >
            <div className="h-full overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">Runtime Settings</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSettingsOpen(false)}
                  >
                    <Dismiss20Regular className="h-4 w-4" />
                  </Button>
                </div>

                {/* Runtime Settings Panel */}
                <RuntimeSettingsPanel
                  knowledgeSources={selectedAgent.knowledgeSources || []}
                  settings={runtimeSettings}
                  onSettingsChange={setRuntimeSettings}
                  hasWebSource={selectedAgent.knowledgeSources?.some(ks => ks.name?.toLowerCase().includes('web')) || false}
                />

                {/* Display Settings */}
                <div className="pt-6 mt-6 border-t border-stroke-divider">
                  <h4 className="text-sm font-medium mb-3">Display Options</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex-1">
                        <div className="text-sm text-fg-default group-hover:text-accent transition-colors">
                          Show cost estimates
                        </div>
                        <div className="text-xs text-fg-muted">
                          Display estimated Azure AI Search costs per query
                        </div>
                        <a
                          href="https://azure.microsoft.com/pricing/details/search/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Learn More
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showCostEstimates}
                        onClick={toggleCostEstimates}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
                          showCostEstimates ? "bg-accent" : "bg-bg-subtle border border-stroke-divider"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-bg-canvas shadow transition-transform",
                            showCostEstimates ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Code Modal */}
      {selectedAgent && (
        <KBViewCodeModal
          isOpen={viewCodeOpen}
          onClose={() => setViewCodeOpen(false)}
          agentId={selectedAgent.id}
          agentName={selectedAgent.name}
          messages={messages}
          searchEndpoint={searchEndpoint}
          runtimeSettings={runtimeSettings}
        />
      )}
    </div>
  )
}

function MessageBubble({ message, agent, showCostEstimates }: { message: Message; agent?: KnowledgeAgent; showCostEstimates?: boolean }) {
  const isUser = message.role === 'user'
  
  // Check if we have trace data (new format)
  const hasTraceData = message.activity && message.activity.length > 0 && message.references
  
  // Extract MCP tool calls from references
  const mcpToolCalls = message.references?.filter(ref => ref.type === 'mcpTool').map(ref => ({
    toolName: ref.toolName || '',
    serverURL: ref.serverURL || '',
    ref_id: parseInt(ref.id) || 0,
    title: ref.sourceData?.title || '',
    content: ref.sourceData?.content || ''
  })) || []

  return (
    <div className={cn('flex items-start gap-4', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'p-2 rounded-full',
        isUser ? 'bg-bg-subtle' : 'bg-accent-subtle'
      )}>
        {isUser ? (
          <Person20Regular className="h-4 w-4" />
        ) : (
          <Bot20Regular className="h-4 w-4 text-accent" />
        )}
      </div>

      <div className={cn('flex-1 max-w-[80%] min-w-0', isUser && 'flex justify-end')}>
        <div className={cn(
          'rounded-lg p-4 overflow-hidden',
          isUser
            ? 'bg-accent text-fg-on-accent ml-12'
            : 'bg-bg-card border border-stroke-divider'
        )}>
          <div className="prose prose-sm max-w-none space-y-3 overflow-x-auto">
            {message.content.map((content, index) => {
              if (content.type === 'text') {
                return (
                  <p key={index} className="whitespace-pre-wrap break-words">
                    <InlineCitationsText
                      text={content.text}
                      references={message.references}
                      activity={message.activity}
                      messageId={message.id}
                      onActivate={() => {}}
                    />
                  </p>
                )
              } else if (content.type === 'image') {
                return (
                  <div key={index} className="max-w-xs">
                    <img 
                      src={content.image.url} 
                      alt="User uploaded content" 
                      className="rounded border border-stroke-divider max-w-full h-auto"
                    />
                  </div>
                )
              }
              return null
            })}
          </div>

          {/* New Trace Explorer UI */}
          {!isUser && hasTraceData && (
            <div className="mt-4 pt-4 border-t border-stroke-divider">
              <TraceExplorer
                response={{
                  response: [{ role: 'assistant', content: message.content.map(c => c.type === 'text' ? { type: 'text', text: c.text } : { type: 'image', image: { url: c.image.url } }) }],
                  activity: message.activity as any || [],
                  references: message.references as any || []
                }}
              />
            </div>
          )}

          {/* MCP Tool Calls (if any) */}
          {mcpToolCalls.length > 0 && (
            <div className="mt-4 pt-4 border-t border-stroke-divider">
              <MCPToolCallDisplay toolCalls={mcpToolCalls} />
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-xs text-fg-muted">
            <span>{formatRelativeTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
