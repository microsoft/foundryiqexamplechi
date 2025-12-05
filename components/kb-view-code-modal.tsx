'use client'

import * as React from 'react'
import { Dismiss20Regular, Copy20Regular, Checkmark20Regular } from '@fluentui/react-icons'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; image: { url: string; file?: File } }

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: MessageContent[]
  timestamp: Date
  references?: any[]
  activity?: any[]
}

interface KBViewCodeModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  agentName: string
  messages: Message[]
  searchEndpoint: string
  runtimeSettings?: {
    outputMode?: 'answerSynthesis' | 'extractiveData'
    reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
    globalHeaders?: Record<string, string>
    knowledgeSourceParams?: Array<{
      knowledgeSourceName: string
      kind: string
      alwaysQuerySource?: boolean
      includeReferences?: boolean
      includeReferenceSourceData?: boolean
      rerankerThreshold?: number | null
      maxSubQueries?: number | null
      headers?: Record<string, string>
    }>
  }
}

export function KBViewCodeModal({ isOpen, onClose, agentId, agentName, messages, searchEndpoint, runtimeSettings }: KBViewCodeModalProps) {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = React.useState('curl')
  const [showSecrets, setShowSecrets] = React.useState(false)

  // Sensitive header detection & masking utilities (used only for display; never mutate real settings)
  const isSensitiveHeader = (key: string) => {
    const lower = key.toLowerCase()
    return (
      ['authorization', 'x-ms-query-source-authorization', 'api-key', 'x-api-key'].includes(lower) ||
      lower.endsWith('token') ||
      lower.endsWith('key') ||
      lower.includes('secret')
    )
  }

  const maskHeaderValue = (key: string, value: string) => {
    if (!value) return value
    if (!isSensitiveHeader(key) || showSecrets) return value
    // Preserve Bearer prefix if present
    const bearerMatch = value.match(/^(Bearer\s+)(.+)$/i)
    if (bearerMatch) {
      const token = bearerMatch[2]
      if (token.length <= 8) return `${bearerMatch[1]}****`
      return `${bearerMatch[1]}${token.slice(0,4)}...${token.slice(-4)}`
    }
    if (value.length <= 8) return '****'
    return `${value.slice(0,4)}...${value.slice(-4)}`
  }

  const maskHeadersObject = (headers?: Record<string, string>) => {
    if (!headers) return headers
    const masked: Record<string, string> = {}
    Object.entries(headers).forEach(([k,v]) => {
      masked[k] = maskHeaderValue(k, v)
    })
    return masked
  }

  const buildMaskedKnowledgeSourceParams = (params?: KBViewCodeModalProps['runtimeSettings'] extends infer R ? R extends { knowledgeSourceParams?: infer K } ? K : any : any) => {
    if (!params) return []
    return params.map((p: any) => ({
      ...p,
      headers: maskHeadersObject(p.headers)
    }))
  }

  const getMaskedGlobalHeaders = () => maskHeadersObject(runtimeSettings?.globalHeaders)

  // Lock body scroll while modal open to prevent double scrollbars (background + modal)
  React.useEffect(() => {
    if (isOpen) {
      const prevBody = document.body.style.overflow
      const prevHtml = document.documentElement.style.overflow
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevBody
        document.documentElement.style.overflow = prevHtml
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const copyCode = async (code: string, language: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(language)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Convert messages to API format
  const formatMessagesForAPI = (msgs: Message[]) => {
    return msgs.map(msg => ({
      role: msg.role,
      content: msg.content.map(c => {
        if (c.type === 'text') {
          return { type: 'text', text: c.text }
        } else if (c.type === 'image') {
          return { type: 'image', image: { url: c.image.url } }
        }
        return c
      })
    }))
  }

  const apiMessages = formatMessagesForAPI(messages)

  // Generate cURL code
  const generateCurlCode = () => {
    // Determine if we should use intents format (when reasoning effort is minimal)
    const useIntentsFormat = runtimeSettings?.reasoningEffort === 'minimal'
    
    // Build the request body exactly as the API does it
    const requestBody: any = {}
    
    if (useIntentsFormat) {
      // For minimal reasoning: use intents format
      // Extract just the text from the last user message
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()
      const lastUserText = lastUserMessage?.content.find(c => c.type === 'text')?.text || 'Your question here'
      
      requestBody.intents = [
        {
          type: 'semantic',
          search: lastUserText
        }
      ]
    } else {
      // Standard format: use messages
      requestBody.messages = apiMessages
    }

    // Add global headers if present
    if (runtimeSettings?.globalHeaders && Object.keys(runtimeSettings.globalHeaders).filter(k => k && runtimeSettings.globalHeaders![k]).length > 0) {
      requestBody.globalHeaders = runtimeSettings.globalHeaders
    }

    // Add output mode if specified
    if (runtimeSettings?.outputMode) {
      requestBody.outputMode = runtimeSettings.outputMode
    }

    // Add reasoning effort if specified (use correct API property name)
    if (runtimeSettings?.reasoningEffort) {
      requestBody.retrievalReasoningEffort = {
        kind: runtimeSettings.reasoningEffort
      }
    }

    // Add knowledge source params if present (match actual API behavior)
    if (runtimeSettings?.knowledgeSourceParams && runtimeSettings.knowledgeSourceParams.length > 0) {
      const filteredParams = runtimeSettings.knowledgeSourceParams.map(param => {
        const result: any = {
          knowledgeSourceName: param.knowledgeSourceName,
          kind: param.kind
        }

        // Only include boolean fields if they are true (API requirement)
        if (param.alwaysQuerySource === true) result.alwaysQuerySource = true
        if (param.includeReferences === true) result.includeReferences = true
        if (param.includeReferenceSourceData === true) result.includeReferenceSourceData = true
        
        // Include numeric fields if they exist
        if (param.rerankerThreshold !== undefined && param.rerankerThreshold !== null) {
          result.rerankerThreshold = param.rerankerThreshold
        }
        if (param.maxSubQueries !== undefined && param.maxSubQueries !== null) {
          result.maxSubQueries = param.maxSubQueries
        }
        
        // Include headers if they exist and are not empty
        if (param.headers && Object.keys(param.headers).filter(k => k && param.headers![k]).length > 0) {
          result.headers = param.headers
        }

        return result
      })

      if (filteredParams.length > 0) {
        requestBody.knowledgeSourceParams = filteredParams
      }
    }

    // Apply masking to headers for display
    if (requestBody.globalHeaders) {
      requestBody.globalHeaders = getMaskedGlobalHeaders()
    }
    if (requestBody.knowledgeSourceParams) {
      requestBody.knowledgeSourceParams = buildMaskedKnowledgeSourceParams(requestBody.knowledgeSourceParams)
    }

    const requestBodyJson = JSON.stringify(requestBody, null, 2)
      .split('\n')
      .join('\n  ')

    return `# Retrieve from knowledge agent using REST API
# This is the actual conversation from your playground session

curl -X POST "${searchEndpoint}/knowledgebases/${agentId}/retrieve?api-version=2025-11-01-preview" \\
  -H "Content-Type: application/json" \\
  -H "api-key: \${AZURE_SEARCH_API_KEY}" \\
  -d '${requestBodyJson}'`
  }

  // Generate Python code
  const generatePythonCode = () => {
    // Determine if we should use intents format (when reasoning effort is minimal)
    const useIntentsFormat = runtimeSettings?.reasoningEffort === 'minimal'
    
    let messagesOrIntentsCode: string
    let requestBodyFirstPart: string
    
    if (useIntentsFormat) {
      // For minimal reasoning: use intents format
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()
      const lastUserText = lastUserMessage?.content.find(c => c.type === 'text')?.text || 'Your question here'
      
      messagesOrIntentsCode = `intents = [
    {
        "type": "semantic",
        "search": "${lastUserText.replace(/"/g, '\\"')}"
    }
]`
      requestBodyFirstPart = '    "intents": intents'
    } else {
      // Standard format: use messages
      const messagesStr = messages.length > 0
        ? JSON.stringify(apiMessages, null, 4).split('\n').map((line, idx) =>
            idx === 0 ? line : `    ${line}`
          ).join('\n')
        : '[\n        {\n            "role": "user",\n            "content": [{"type": "text", "text": "Your question here"}]\n        }\n    ]'
      
      messagesOrIntentsCode = `messages = ${messagesStr}`
      requestBodyFirstPart = '    "messages": messages'
    }

    // Build request body dict matching actual API structure
    let requestBodyParts = [requestBodyFirstPart]

    // Add global headers
    if (runtimeSettings?.globalHeaders && Object.keys(runtimeSettings.globalHeaders).filter(k => k && runtimeSettings.globalHeaders![k]).length > 0) {
      const globalHeadersStr = JSON.stringify(getMaskedGlobalHeaders(), null, 4)
        .split('\n').map((line, idx) => idx === 0 ? line : `    ${line}`).join('\n')
      requestBodyParts.push(`    "globalHeaders": ${globalHeadersStr}`)
    }

    // Add output mode
    if (runtimeSettings?.outputMode) {
      requestBodyParts.push(`    "outputMode": "${runtimeSettings.outputMode}"`)
    }

    // Add reasoning effort (use correct API property)
    if (runtimeSettings?.reasoningEffort) {
      requestBodyParts.push(`    "retrievalReasoningEffort": {"kind": "${runtimeSettings.reasoningEffort}"}`)
    }

    // Add knowledge source params matching actual API behavior
    if (runtimeSettings?.knowledgeSourceParams && runtimeSettings.knowledgeSourceParams.length > 0) {
      const paramsStr = runtimeSettings.knowledgeSourceParams.map(param => {
        const maskedHeaders = maskHeadersObject(param.headers)
        const lines = [`        {\n            "knowledgeSourceName": "${param.knowledgeSourceName}"`,
                       `            "kind": "${param.kind}"`]
        if (param.alwaysQuerySource === true) lines.push(`            "alwaysQuerySource": True`)
        if (param.includeReferences === true) lines.push(`            "includeReferences": True`)
        if (param.includeReferenceSourceData === true) lines.push(`            "includeReferenceSourceData": True`)
        if (param.rerankerThreshold !== undefined && param.rerankerThreshold !== null) {
          lines.push(`            "rerankerThreshold": ${param.rerankerThreshold}`)
        }
        if (param.maxSubQueries !== undefined && param.maxSubQueries !== null) {
          lines.push(`            "maxSubQueries": ${param.maxSubQueries}`)
        }
        if (maskedHeaders && Object.keys(maskedHeaders).filter(k => k && maskedHeaders![k]).length > 0) {
          lines.push(`            "headers": ${JSON.stringify(maskedHeaders)}`)
        }
        return lines.join(',\n') + '\n        }'
      }).join(',\n')
      requestBodyParts.push(`    "knowledgeSourceParams": [\n${paramsStr}\n    ]`)
    }

    const requestBodyStr = requestBodyParts.length > 1 
      ? '{\n' + requestBodyParts.join(',\n') + '\n}'
      : useIntentsFormat ? '{"intents": intents}' : '{"messages": messages}'

    return `# pip install azure-search-documents==11.7.0b1
import os
from azure.search.documents.agentic import SearchAgentClient
from azure.core.credentials import AzureKeyCredential

# Initialize client
endpoint = "${searchEndpoint}"
api_key = os.environ.get("AZURE_SEARCH_API_KEY")
agent_id = "${agentId}"

client = SearchAgentClient(endpoint, AzureKeyCredential(api_key))

# ${useIntentsFormat ? 'Intents for semantic search (minimal reasoning)' : 'Messages from your conversation'}
# ${!useIntentsFormat && messages.length > 0 ? `${messages.length} message(s) in history` : 'Start with your first question'}
${messagesOrIntentsCode}

# Build request body (matches actual API structure)
request_body = ${requestBodyStr}

# Retrieve from agent
response = client.agents.retrieve(
    agent_name=agent_id,
    body=request_body
)

# Process response
if response.response and len(response.response) > 0:
    answer = response.response[0].content[0].text
    print(f"Answer: {answer}")
    print()

# Display references/citations
if response.references:
    print(f"\\nFound {len(response.references)} references:")
    for i, ref in enumerate(response.references, 1):
        print(f"  [{i}] {ref.get('id', 'Unknown')}")
        if ref.get('sourceData'):
            # Extract snippet or title
            source_data = ref['sourceData']
            if 'chunk' in source_data:
                snippet = source_data['chunk'][:100] + "..."
                print(f"      {snippet}")

# Display activity/metrics
if response.activity:
    print(f"\\nPerformed {len(response.activity)} operations")
    total_tokens = sum(
        act.get('inputTokens', 0) + act.get('outputTokens', 0)
        for act in response.activity
    )
    print(f"Total tokens used: {total_tokens}")`
  }

  // Generate TypeScript code
  const generateTypeScriptCode = () => {
    const messagesStr = messages.length > 0
      ? JSON.stringify(apiMessages, null, 2).split('\n').map((line, idx) =>
          idx === 0 ? line : `  ${line}`
        ).join('\n')
      : '[\n    {\n      role: "user" as const,\n      content: [{ type: "text", text: "Your question here" }]\n    }\n  ]'

    // Build request body matching actual API structure
    let requestBodyParts = ['messages']

    if (runtimeSettings?.globalHeaders && Object.keys(runtimeSettings.globalHeaders).filter(k => k && runtimeSettings.globalHeaders![k]).length > 0) {
      const globalHeadersStr = JSON.stringify(getMaskedGlobalHeaders(), null, 2)
        .split('\n').map((line, idx) => idx === 0 ? line : `  ${line}`).join('\n')
      requestBodyParts.push(`globalHeaders: ${globalHeadersStr}`)
    }

    if (runtimeSettings?.outputMode) {
      requestBodyParts.push(`outputMode: "${runtimeSettings.outputMode}"`)
    }

    if (runtimeSettings?.reasoningEffort) {
      requestBodyParts.push(`retrievalReasoningEffort: { kind: "${runtimeSettings.reasoningEffort}" }`)
    }

    if (runtimeSettings?.knowledgeSourceParams && runtimeSettings.knowledgeSourceParams.length > 0) {
      const paramsArr = runtimeSettings.knowledgeSourceParams.map(param => {
        const maskedHeaders = maskHeadersObject(param.headers)
        const props = [`knowledgeSourceName: "${param.knowledgeSourceName}"`, `kind: "${param.kind}"`]
        if (param.alwaysQuerySource === true) props.push('alwaysQuerySource: true')
        if (param.includeReferences === true) props.push('includeReferences: true')
        if (param.includeReferenceSourceData === true) props.push('includeReferenceSourceData: true')
        if (param.rerankerThreshold !== undefined && param.rerankerThreshold !== null) {
          props.push(`rerankerThreshold: ${param.rerankerThreshold}`)
        }
        if (param.maxSubQueries !== undefined && param.maxSubQueries !== null) {
          props.push(`maxSubQueries: ${param.maxSubQueries}`)
        }
        if (maskedHeaders && Object.keys(maskedHeaders).filter(k => k && maskedHeaders![k]).length > 0) {
          props.push(`headers: ${JSON.stringify(maskedHeaders)}`)
        }
        return `    { ${props.join(', ')} }`
      }).join(',\n')

      requestBodyParts.push(`knowledgeSourceParams: [\n${paramsArr}\n  ]`)
    }

    const requestBody = requestBodyParts.length === 1 
      ? '{ messages }' 
      : `{\n    ${requestBodyParts.join(',\n    ')}\n  }`

    return `// npm install @azure/search-documents@12.0.0-beta.9
import { SearchAgentClient, AzureKeyCredential } from "@azure/search-documents";

// Initialize client
const endpoint = "${searchEndpoint}";
const apiKey = process.env.AZURE_SEARCH_API_KEY || "";
const agentId = "${agentId}";

const client = new SearchAgentClient(endpoint, new AzureKeyCredential(apiKey));

// Messages from your conversation
// ${messages.length > 0 ? `${messages.length} message(s) in history` : 'Start with your first question'}
const messages = ${messagesStr};

// Retrieve from agent (matches actual API structure)
async function retrieveFromAgent() {
  try {
    const response = await client.agents.retrieve(agentId, ${requestBody});

    // Process response
    if (response.response && response.response.length > 0) {
      const answer = response.response[0].content[0].text;
      console.log(\`Answer: \${answer}\`);
    }

    // Display references
    if (response.references && response.references.length > 0) {
      console.log(\`\\nFound \${response.references.length} references:\`);
      response.references.forEach((ref, i) => {
        console.log(\`  [\${i + 1}] \${ref.id || 'Unknown'}\`);
        if (ref.sourceData?.chunk) {
          const snippet = ref.sourceData.chunk.substring(0, 100) + "...";
          console.log(\`      \${snippet}\`);
        }
      });
    }

    // Display activity
    if (response.activity && response.activity.length > 0) {
      console.log(\`\\nPerformed \${response.activity.length} operations\`);
      const totalTokens = response.activity.reduce(
        (sum, act) => sum + (act.inputTokens || 0) + (act.outputTokens || 0),
        0
      );
      console.log(\`Total tokens used: \${totalTokens}\`);
    }
  } catch (error) {
    console.error("Error retrieving from agent:", error);
    throw error;
  }
}

retrieveFromAgent().catch(console.error);`
  }

  // Generate .NET code
  const generateDotNetCode = () => {
    const messagesFormatted = messages.map(msg => {
      const contentFormatted = msg.content.map(c => {
        if (c.type === 'text') {
          return `                    new MessageContent { Type = "text", Text = ${JSON.stringify(c.text)} }`
        }
        return `                    new MessageContent { Type = "image", Image = new { Url = ${JSON.stringify(c.image.url)} } }`
      }).join(',\n')

      return `            new Message
            {
                Role = MessageRole.${msg.role === 'user' ? 'User' : 'Assistant'},
                Content = new[]
                {
${contentFormatted}
                }
            }`
    }).join(',\n')

    const messagesCode = messages.length > 0 ? messagesFormatted : `            new Message
            {
                Role = MessageRole.User,
                Content = new[]
                {
                    new MessageContent { Type = "text", Text = "Your question here" }
                }
            }`

    // Build request properties matching actual API structure
    let requestProperties = ['Messages = messages']

    if (runtimeSettings?.globalHeaders && Object.keys(runtimeSettings.globalHeaders).filter(k => k && runtimeSettings.globalHeaders![k]).length > 0) {
      const headersEntries = Object.entries(getMaskedGlobalHeaders() || {})
        .filter(([k, v]) => k && v)
        .map(([k, v]) => `        { ${JSON.stringify(k)}, ${JSON.stringify(v)} }`)
        .join(',\n')
      requestProperties.push(`GlobalHeaders = new Dictionary<string, string>\n    {\n${headersEntries}\n    }`)
    }

    if (runtimeSettings?.outputMode) {
      requestProperties.push(`OutputMode = "${runtimeSettings.outputMode}"`)
    }

    if (runtimeSettings?.reasoningEffort) {
      requestProperties.push(`RetrievalReasoningEffort = new ReasoningEffort { Kind = "${runtimeSettings.reasoningEffort}" }`)
    }

    if (runtimeSettings?.knowledgeSourceParams && runtimeSettings.knowledgeSourceParams.length > 0) {
      const paramsFormatted = runtimeSettings.knowledgeSourceParams.map(param => {
        const props = [
          `KnowledgeSourceName = ${JSON.stringify(param.knowledgeSourceName)}`,
          `Kind = ${JSON.stringify(param.kind)}`
        ]
        if (param.alwaysQuerySource === true) props.push('AlwaysQuerySource = true')
        if (param.includeReferences === true) props.push('IncludeReferences = true')
        if (param.includeReferenceSourceData === true) props.push('IncludeReferenceSourceData = true')
        if (param.rerankerThreshold !== undefined && param.rerankerThreshold !== null) {
          props.push(`RerankerThreshold = ${param.rerankerThreshold}`)
        }
        if (param.maxSubQueries !== undefined && param.maxSubQueries !== null) {
          props.push(`MaxSubQueries = ${param.maxSubQueries}`)
        }
        const maskedHeaders = maskHeadersObject(param.headers)
        if (maskedHeaders && Object.keys(maskedHeaders).filter(k => k && maskedHeaders![k]).length > 0) {
          const headers = Object.entries(maskedHeaders)
            .filter(([k, v]) => k && v)
            .map(([k, v]) => `                { ${JSON.stringify(k)}, ${JSON.stringify(v)} }`)
            .join(',\n')
          props.push(`Headers = new Dictionary<string, string>\n            {\n${headers}\n            }`)
        }
        return `        new KnowledgeSourceParam\n        {\n            ${props.join(',\n            ')}\n        }`
      }).join(',\n')

      requestProperties.push(`KnowledgeSourceParams = new List<KnowledgeSourceParam>\n    {\n${paramsFormatted}\n    }`)
    }

    const requestPropertiesStr = requestProperties.join(',\n    ')

    return `// NuGet: Azure.Search.Documents -Version 12.0.0-beta.8
using Azure;
using Azure.Search.Documents;
using Azure.Search.Documents.Models.Agentic;

// Initialize client
string endpoint = "${searchEndpoint}";
string apiKey = Environment.GetEnvironmentVariable("AZURE_SEARCH_API_KEY");
string agentId = "${agentId}";

var credential = new AzureKeyCredential(apiKey);
var client = new SearchAgentClient(new Uri(endpoint), credential);

// Messages from your conversation (${messages.length} message(s))
var messages = new List<Message>
{
${messagesCode}
};

// Retrieve from agent (matches actual API structure)
var request = new RetrieveRequest
{
    ${requestPropertiesStr}
};

RetrieveResponse response = await client.Agents.RetrieveAsync(agentId, request);

// Process response
if (response.Response?.Any() == true)
{
    var answer = response.Response[0].Content[0].Text;
    Console.WriteLine($"Answer: {answer}");
}

// Display references
if (response.References != null && response.References.Any())
{
    Console.WriteLine($"\\nFound {response.References.Count} references:");
    for (int i = 0; i < response.References.Count; i++)
    {
        var reference = response.References[i];
        Console.WriteLine($"  [{i + 1}] {reference.Id ?? "Unknown"}");

        if (reference.SourceData?.ContainsKey("chunk") == true)
        {
            var snippet = reference.SourceData["chunk"].ToString()
                ?.Substring(0, Math.Min(100, reference.SourceData["chunk"].ToString().Length)) + "...";
            Console.WriteLine($"      {snippet}");
        }
    }
}

// Display activity
if (response.Activity != null && response.Activity.Any())
{
    Console.WriteLine($"\\nPerformed {response.Activity.Count} operations");
    var totalTokens = response.Activity.Sum(act =>
        (act.InputTokens ?? 0) + (act.OutputTokens ?? 0)
    );
    Console.WriteLine($"Total tokens used: {totalTokens}");
}`
  }

  // Generate Java code
  const generateJavaCode = () => {
    const messagesFormatted = messages.map((msg, idx) => {
      const contentItems = msg.content.map((c, cidx) => {
        if (c.type === 'text') {
          return `                new MessageContent()
                    .setType("text")
                    .setText(${JSON.stringify(c.text)})`
        }
        return `                new MessageContent()
                    .setType("image")
                    .setImage(new ImageContent().setUrl(${JSON.stringify(c.image.url)}))`
      }).join(',\n')

      return `            new Message()
                .setRole(MessageRole.${msg.role.toUpperCase()})
                .setContent(Arrays.asList(
${contentItems}
                ))`
    }).join(',\n')

    const messagesCode = messages.length > 0 ? messagesFormatted : `            new Message()
                .setRole(MessageRole.USER)
                .setContent(Arrays.asList(
                    new MessageContent()
                        .setType("text")
                        .setText("Your question here")
                ))`

    // Build request matching actual API structure
    let requestChain = ['.setMessages(messages)']

    if (runtimeSettings?.globalHeaders && Object.keys(runtimeSettings.globalHeaders).filter(k => k && runtimeSettings.globalHeaders![k]).length > 0) {
      const headersMap = Object.entries(getMaskedGlobalHeaders() || {})
        .filter(([k, v]) => k && v)
        .map(([k, v]) => `map.put(${JSON.stringify(k)}, ${JSON.stringify(v)});`)
        .join('\n            ')
      requestChain.push(`.setGlobalHeaders(new HashMap<String, String>() {{
            ${headersMap}
        }})`)
    }

    if (runtimeSettings?.outputMode) {
      requestChain.push(`.setOutputMode("${runtimeSettings.outputMode}")`)
    }

    if (runtimeSettings?.reasoningEffort) {
      requestChain.push(`.setRetrievalReasoningEffort(new ReasoningEffort().setKind("${runtimeSettings.reasoningEffort}"))`)
    }

    if (runtimeSettings?.knowledgeSourceParams && runtimeSettings.knowledgeSourceParams.length > 0) {
      const paramsFormatted = runtimeSettings.knowledgeSourceParams.map(param => {
        let paramChain = `new KnowledgeSourceParam()\n                .setKnowledgeSourceName(${JSON.stringify(param.knowledgeSourceName)})\n                .setKind(${JSON.stringify(param.kind)})`
        if (param.alwaysQuerySource === true) paramChain += `\n                .setAlwaysQuerySource(true)`
        if (param.includeReferences === true) paramChain += `\n                .setIncludeReferences(true)`
        if (param.includeReferenceSourceData === true) paramChain += `\n                .setIncludeReferenceSourceData(true)`
        if (param.rerankerThreshold !== undefined && param.rerankerThreshold !== null) {
          paramChain += `\n                .setRerankerThreshold(${param.rerankerThreshold})`
        }
        if (param.maxSubQueries !== undefined && param.maxSubQueries !== null) {
          paramChain += `\n                .setMaxSubQueries(${param.maxSubQueries})`
        }
        const maskedHeaders = maskHeadersObject(param.headers)
        if (maskedHeaders && Object.keys(maskedHeaders).filter(k => k && maskedHeaders![k]).length > 0) {
          const headers = Object.entries(maskedHeaders)
            .filter(([k, v]) => k && v)
            .map(([k, v]) => `h.put(${JSON.stringify(k)}, ${JSON.stringify(v)});`)
            .join('\n                    ')
          paramChain += `\n                .setHeaders(new HashMap<String, String>() {{\n                    ${headers}\n                }})`
        }
        return `            ${paramChain}`
      }).join(',\n')

      requestChain.push(`.setKnowledgeSourceParams(Arrays.asList(\n${paramsFormatted}\n        ))`)
    }

    const requestChainStr = requestChain.join('\n            ')

    return `// Maven: com.azure:azure-search-documents:11.8.0-beta.1
import com.azure.core.credential.AzureKeyCredential;
import com.azure.search.documents.SearchAgentClient;
import com.azure.search.documents.SearchAgentClientBuilder;
import com.azure.search.documents.models.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

public class KnowledgeAgentExample {
    public static void main(String[] args) {
        // Initialize client
        String endpoint = "${searchEndpoint}";
        String apiKey = System.getenv("AZURE_SEARCH_API_KEY");
        String agentId = "${agentId}";

        SearchAgentClient client = new SearchAgentClientBuilder()
            .endpoint(endpoint)
            .credential(new AzureKeyCredential(apiKey))
            .buildClient();

        // Messages from your conversation (${messages.length} message(s))
        List<Message> messages = Arrays.asList(
${messagesCode}
        );

        // Retrieve from agent (matches actual API structure)
        RetrieveRequest request = new RetrieveRequest()
            ${requestChainStr};

        RetrieveResponse response = client.getAgents()
            .retrieve(agentId, request);

        // Process response
        if (response.getResponse() != null && !response.getResponse().isEmpty()) {
            String answer = response.getResponse().get(0)
                .getContent().get(0).getText();
            System.out.println("Answer: " + answer);
        }

        // Display references
        if (response.getReferences() != null && !response.getReferences().isEmpty()) {
            System.out.println("\\nFound " + response.getReferences().size() + " references:");
            for (int i = 0; i < response.getReferences().size(); i++) {
                Reference ref = response.getReferences().get(i);
                System.out.println("  [" + (i + 1) + "] " +
                    (ref.getId() != null ? ref.getId() : "Unknown"));

                if (ref.getSourceData() != null && ref.getSourceData().containsKey("chunk")) {
                    String chunk = ref.getSourceData().get("chunk").toString();
                    String snippet = chunk.substring(0, Math.min(100, chunk.length())) + "...";
                    System.out.println("      " + snippet);
                }
            }
        }

        // Display activity
        if (response.getActivity() != null && !response.getActivity().isEmpty()) {
            System.out.println("\\nPerformed " + response.getActivity().size() + " operations");
            int totalTokens = response.getActivity().stream()
                .mapToInt(act ->
                    (act.getInputTokens() != null ? act.getInputTokens() : 0) +
                    (act.getOutputTokens() != null ? act.getOutputTokens() : 0)
                )
                .sum();
            System.out.println("Total tokens used: " + totalTokens);
        }
    }
}`
  }

  const getCodeSnippet = (language: string) => {
    switch (language) {
      case 'curl': return generateCurlCode()
      case 'python': return generatePythonCode()
      case 'typescript': return generateTypeScriptCode()
      case 'dotnet': return generateDotNetCode()
      case 'java': return generateJavaCode()
      default: return generateCurlCode()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="bg-bg-canvas border border-stroke-divider rounded-lg w-[95vw] max-w-[1400px] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stroke-divider flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-fg-default">View Code</h2>
            <p className="text-sm text-fg-muted">
              {messages.length > 0
                ? `Code to reproduce your ${messages.length} message conversation with ${agentName}`
                : `Code example for querying ${agentName} agent`
              }
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Dismiss20Regular className="h-4 w-4" />
          </Button>
        </div>

    {/* Content */}
  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {/* Language selector and copy button */}
            <div className="flex items-center justify-between">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="curl">cURL (REST API)</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="dotnet">.NET (C#)</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSecrets(prev => !prev)}
                  className="text-xs px-2 py-1 rounded border border-stroke-divider hover:bg-bg-subtle transition-colors"
                  aria-pressed={showSecrets}
                >
                  {showSecrets ? 'Hide secrets' : 'Reveal secrets'}
                </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyCode(getCodeSnippet(selectedLanguage), selectedLanguage)}
                className="h-8"
              >
                {copiedCode === selectedLanguage ? (
                  <>
                    <Checkmark20Regular className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy20Regular className="h-4 w-4 mr-2" />
                    Copy code
                  </>
                )}
              </Button>
              </div>
            </div>

            {/* Message count info */}
            {messages.length > 0 && (
              <div className="bg-accent-subtle border border-accent rounded-md p-3">
                <div className="text-sm text-fg-default">
                  <strong>💬 Conversation:</strong> This code includes all {messages.length} message(s) from your current session
                  ({messages.filter(m => m.role === 'user').length} user, {messages.filter(m => m.role === 'assistant').length} assistant)
                </div>
              </div>
            )}

            {/* SDK version info */}
            <div className="bg-bg-subtle border border-stroke-divider rounded-md p-3">
              <div className="text-xs text-fg-muted space-y-1">
                <div className="font-medium text-fg-default mb-1">Installation:</div>
                {selectedLanguage === 'python' && <div><code className="bg-bg-canvas px-1">pip install azure-search-documents==11.7.0b1</code></div>}
                {selectedLanguage === 'typescript' && <div><code className="bg-bg-canvas px-1">npm install @azure/search-documents@12.0.0-beta.9</code></div>}
                {selectedLanguage === 'java' && <div><code className="bg-bg-canvas px-1">com.azure:azure-search-documents:11.8.0-beta.1</code></div>}
                {selectedLanguage === 'dotnet' && <div><code className="bg-bg-canvas px-1">dotnet add package Azure.Search.Documents --version 12.0.0-beta.8</code></div>}
                {selectedLanguage === 'curl' && <div>REST API: <code className="bg-bg-canvas px-1">2025-11-01-preview</code></div>}
              </div>
            </div>

            {/* Code snippet */}
            <div className="relative">
              <pre className="bg-bg-subtle border border-stroke-divider rounded-md p-4 text-xs text-fg-default overflow-x-auto">
                <code>{getCodeSnippet(selectedLanguage)}</code>
              </pre>
              {!showSecrets && (
                <div className="mt-2 text-[10px] text-fg-muted">
                  Sensitive header values (tokens, keys) have been masked. Click "Reveal secrets" to show actual values. Do NOT commit real secrets to source control.
                </div>
              )}
            </div>

            {/* Environment variables note */}
            <div className="text-xs text-fg-muted space-y-2">
              <div className="font-medium text-fg-default">Environment Setup:</div>
              <div className="bg-bg-subtle border border-stroke-divider rounded p-2 space-y-1">
                <div>• Set <code className="bg-bg-canvas px-1">AZURE_SEARCH_API_KEY</code> environment variable with your API key</div>
                <div>• Service endpoint: <code className="bg-bg-canvas px-1">{searchEndpoint}</code></div>
                <div>• Agent ID: <code className="bg-bg-canvas px-1">{agentId}</code></div>
                <div className="text-[10px] pt-1 text-status-warning">Never hardcode secrets. Use environment variables or managed identity. Headers shown above are for reproducibility only.</div>
              </div>
            </div>

            {/* Documentation link */}
            <div className="bg-accent-subtle border border-accent rounded-md p-3">
              <div className="text-sm text-fg-default">
                <strong>📚 Documentation:</strong>
                <a
                  href="https://learn.microsoft.com/azure/search/search-get-started-agentic-retrieval"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-accent hover:underline"
                >
                  Azure AI Search - Agentic Retrieval Quickstart
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


