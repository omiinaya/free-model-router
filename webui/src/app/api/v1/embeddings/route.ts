import { NextRequest, NextResponse } from 'next/server'
import { readConfig } from '@/lib/config'
import { sources } from '@/lib/sources'
import { getApiKeyForProvider } from '@/lib/key-rotation'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { appendFile } from 'node:fs/promises'

// Mapping of providers to their embedding endpoints
const EMBEDDING_ENDPOINTS: Record<string, { url: string; model: string }> = {
  openai: {
    url: 'https://api.openai.com/v1/embeddings',
    model: 'text-embedding-3-small',
  },
  Cohere: {
    url: 'https://api.cohere.ai/v1/embeddings',
    model: 'embed-english-v3.0',
  },
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const fcmApiKey = authHeader?.replace('Bearer ', '') || request.headers.get('x-api-key')
    const config = await readConfig()

    if (!fcmApiKey) {
      return NextResponse.json({ 
        error: { message: 'Missing API key', type: 'invalid_request_error', code: 'authentication_failed' }
      }, { status: 401 })
    }

    if (config.fcmProxyKey && fcmApiKey !== config.fcmProxyKey) {
      return NextResponse.json({ 
        error: { message: 'Invalid API key', type: 'invalid_request_error', code: 'authentication_failed' }
      }, { status: 401 })
    }

    const body = await request.json()
    const input = body.input
    const model = body.model || 'text-embedding-3-small'

    if (!input) {
      return NextResponse.json({ 
        error: { message: 'Missing required parameter: input', type: 'invalid_request_error', param: 'input' }
      }, { status: 400 })
    }

    // Find a provider with embedding support and API key
    const providerWithKey = findEmbeddingProvider(config)
    
    if (!providerWithKey) {
      return NextResponse.json({ 
        error: { message: 'No embedding provider configured. Add OpenAI or Cohere API key in Settings.', type: 'server_error', code: 'no_embedding_provider' }
      }, { status: 503 })
    }

    const { providerKey, apiKey, endpoint } = providerWithKey

    // Build the request based on provider
    let providerBody: any = {}
    
    if (providerKey === 'openai' || providerKey === 'cohere') {
      providerBody = {
        model: endpoint.model,
        input: Array.isArray(input) ? input : [input],
      }
    } else {
      // Generic fallback
      providerBody = {
        model: endpoint.model,
        input: Array.isArray(input) ? input : [input],
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }

    // Provider-specific headers
    if (providerKey === 'cohere') {
      headers['Cohere-Version'] = '2024-10-10'
    }

    const startTime = Date.now()
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(providerBody),
    })
    const latency = Date.now() - startTime

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        error: { message: errorData.message || 'Embedding provider error', type: 'server_error' }
      }, { status: response.status })
    }

    const data = await response.json()

    // Convert to OpenAI format if needed
    const result = convertToOpenAIFormat(data, providerKey, model)

    // Log the request
    logRequest(providerKey, 'embeddings', response.status, Array.isArray(input) ? input.length : 1, latency, result.data.length, '/v1/embeddings')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Embeddings error:', error)
    return NextResponse.json({ 
      error: { message: 'Internal server error', type: 'server_error' }
    }, { status: 500 })
  }
}

function findEmbeddingProvider(config: any) {
  // Priority: OpenAI > Cohere > others with embedding support
  const priorityProviders = ['openai', 'cohere']

  for (const providerKey of priorityProviders) {
    const apiKey = getApiKeyForProvider(providerKey, config.apiKeys)
    if (apiKey && EMBEDDING_ENDPOINTS[providerKey]) {
      return {
        providerKey,
        apiKey,
        endpoint: EMBEDDING_ENDPOINTS[providerKey],
      }
    }
  }

  // Check if any other provider has embedding capability configured
  for (const [providerKey, apiKey] of Object.entries(config.apiKeys || {})) {
    if (apiKey && EMBEDDING_ENDPOINTS[providerKey]) {
      return {
        providerKey,
        apiKey: Array.isArray(apiKey) ? apiKey[0] : apiKey,
        endpoint: EMBEDDING_ENDPOINTS[providerKey],
      }
    }
  }

  return null
}

function convertToOpenAIFormat(data: any, provider: string, requestedModel: string) {
  // Most providers return similar format, but normalize if needed
  if (provider === 'cohere') {
    // Cohere returns: { embeddings: [[...]], id: "..." }
    return {
      object: 'list',
      data: data.embeddings.map((embedding: number[], idx: number) => ({
        object: 'embedding',
        embedding: embedding,
        index: idx,
      })),
      model: requestedModel,
      usage: {
        prompt_tokens: data.meta?.tokens?.input_tokens || 0,
        total_tokens: data.meta?.tokens?.input_tokens || 0,
      },
    }
  }

  // OpenAI format is already correct
  return {
    ...data,
    model: requestedModel,
  }
}

interface LogEntry {
  timestamp: string
  provider: string
  model: string
  status: number
  messages: number
  latency?: number
  tokens?: number
  route?: string
}

async function logRequest(providerKey: string, modelId: string, status: number, messagesCount: number, latency: number, tokens: number, route: string) {
  try {
    const logPath = join(homedir(), '.free-coding-models-requests.jsonl')
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      provider: providerKey,
      model: modelId,
      status,
      messages: messagesCount,
      latency,
      tokens,
      route,
    }
    await appendFile(logPath, JSON.stringify(entry) + '\n', { flag: 'a' })
  } catch (error) {
    // Silent fail
  }
}