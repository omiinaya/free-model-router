import { NextRequest, NextResponse } from 'next/server'
import { readConfig } from '@/lib/config'
import { sources } from '@/lib/sources'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { appendFile } from 'node:fs/promises'

const roundRobinState: Map<string, number> = new Map()

function generateRequestId(): string {
  return 'req_' + Math.random().toString(36).slice(2, 15)
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

    // Check rate limit
    const rateLimit = await checkRateLimit(fcmApiKey)
    const rateLimitHeaders = getRateLimitHeaders(rateLimit.remaining, rateLimit.resetIn)
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: { 
          message: 'Rate limit exceeded', 
          type: 'rate_limit_error', 
          code: 'rate_limit_exceeded' 
        }
      }, { 
        status: 429,
        headers: rateLimitHeaders,
      })
    }

    const requestId = generateRequestId()
    const body = await request.json()
    const stream = body.stream === true

    // Get model from request body (OpenAI clients often specify this)
    const requestedModel = body.model

    // Custom headers for routing control
    const modeHeader = request.headers.get('x-mode') || (requestedModel ? 'specific' : 'default')
    const modelHeader = request.headers.get('x-model') || requestedModel
    const groupHeader = request.headers.get('x-group')
    const poolHeader = request.headers.get('x-pool')
    const bestHeader = request.headers.get('x-best')

    const allModels = getEnabledModels(config)
    let pool = allModels

    if (groupHeader) {
      const parts = groupHeader.split(':')
      if (parts[0]) {
        pool = pool.filter(m => m.tier === parts[0])
      }
      if (parts[1]) {
        pool = pool.filter(m => m.providerKey === parts[1])
      }
    }

    const favorites = pool.filter(m => m.isFavorite)
    const nonFavorites = pool.filter(m => !m.isFavorite)

    let selected: any = null

    if (bestHeader === 'true') {
      selected = selectBestModel(pool, config)
    } else {
      switch (modeHeader) {
        case 'specific':
          if (modelHeader) {
            selected = pool.find(m => m.modelId === modelHeader)
            if (!selected) {
              return NextResponse.json({ 
                error: { message: `Model '${modelHeader}' not found or not available`, type: 'invalid_request_error', param: 'model', code: 'model_not_found' }
              }, { status: 404 })
            }
          } else {
            const defaultPool = favorites.length > 0 ? favorites : pool
            selected = selectBestModel(defaultPool, config)
          }
          break
        case 'group':
          const combined = [...favorites, ...nonFavorites]
          selected = selectBestModel(combined, config) || selectBestModel(pool, config)
          break
        case 'round-robin':
          const poolSpec = poolHeader || (groupHeader ? `group:${groupHeader}` : 'all')
          const rrCandidates = [...favorites, ...nonFavorites]
          selected = selectModelRoundRobin(poolSpec, rrCandidates, config) || selectBestModel(rrCandidates, config)
          break
        case 'default':
        default:
          // Default: favorites-first, then best model
          const defaultPool = favorites.length > 0 ? favorites : pool
          selected = selectBestModel(defaultPool, config)
      }
    }

    if (!selected) {
      return NextResponse.json({ 
        error: { message: 'No suitable model available', type: 'server_error', code: 'no_available_models' }
      }, { status: 503 })
    }

    const apiKey = Array.isArray(selected.apiKey) ? selected.apiKey[0] : selected.apiKey

    if (stream) {
      return handleStreaming(selected.providerKey, selected.modelId, apiKey, body)
    }

    return proxyRequest(selected.providerKey, selected.modelId, apiKey, body, rateLimitHeaders)
  } catch (error) {
    console.error('Completions error:', error)
    return NextResponse.json({ 
      error: { message: 'Internal server error', type: 'server_error' }
    }, { status: 500 })
  }
}

function getEnabledModels(config: any) {
  return Object.entries(sources)
    .filter(([providerKey]) => config.providers[providerKey]?.enabled !== false)
    .flatMap(([providerKey, src]: [string, any]) =>
      src.models.map((model: any[]) => ({
        modelId: model[0],
        label: model[1],
        tier: model[2],
        sweScore: model[3],
        ctx: model[4],
        providerKey,
        pings: [],
        status: 'pending' as const,
        httpCode: null,
        isPinging: false,
        hidden: false,
        isFavorite: config.favorites?.includes(`${providerKey}/${model[0]}`),
        apiKey: config.apiKeys[providerKey],
      }))
    )
    .filter(m => m.apiKey && !m.hidden)
}

function computeModelScore(m: any, config: any): number {
  let score = 0
  if (m.isFavorite) score += 30
  const tierScores: Record<string, number> = { 'S+': 30, 'S': 25, 'A+': 20, 'A': 15, 'A-': 10, 'B+': 5, 'B': 3, 'C': 1 }
  score += tierScores[m.tier] || 0
  if (config.providers[m.providerKey]?.enabled === false) {
    score -= 1000
  }
  return score
}

function selectBestModel(candidates: any[], config: any): any | null {
  const scored = candidates
    .filter(m => m.apiKey && !m.hidden)
    .map(m => ({ ...m, score: computeModelScore(m, config) }))
  scored.sort((a, b) => b.score - a.score)
  return scored[0] || null
}

function selectModelRoundRobin(pool: string, candidates: any[], config: any): any | null {
  const idx = roundRobinState.get(pool) || 0
  const count = candidates.length
  if (count === 0) return null

  for (let i = 0; i < count; i++) {
    const candidate = candidates[(idx + i) % count]
    if (!candidate.apiKey || candidate.hidden) continue
    roundRobinState.set(pool, (idx + i + 1) % count)
    return candidate
  }
  return null
}

async function handleStreaming(providerKey: string, modelId: string, apiKey: string, body: any) {
  const src = sources[providerKey]

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }

  if (providerKey === 'openrouter') {
    headers['HTTP-Referer'] = 'https://github.com/vava-nessa/free-coding-models'
    headers['X-Title'] = 'free-coding-models'
  }

  const encoder = new TextEncoder()
  const startTime = Date.now()

  try {
    const response = await fetch(src.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, model: modelId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    const latency = Date.now() - startTime

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(value)
          }
        } catch (e) {
          // Handle errors
        } finally {
          controller.close()
          // Log the request after streaming completes
          logRequest(providerKey, modelId, response.status, body.messages?.length || 0, latency, 0, src.url)
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Streaming error:', error)
    return NextResponse.json({ 
      error: { message: 'Streaming error', type: 'server_error' }
    }, { status: 500 })
  }
}

async function proxyRequest(providerKey: string, modelId: string, apiKey: string, body: any, rateLimitHeaders: Record<string, string> = {}, requestId?: string): Promise<NextResponse> {
  const src = sources[providerKey]

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }

  if (providerKey === 'openrouter') {
    headers['HTTP-Referer'] = 'https://github.com/vava-nessa/free-coding-models'
    headers['X-Title'] = 'free-coding-models'
  }

  const startTime = Date.now()
  const response = await fetch(src.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...body, model: modelId }),
  })
  const latency = Date.now() - startTime

  const data = await response.json()
  const tokens = data.usage?.total_tokens || 0

  const route = (() => {
    try {
      const url = new URL(src.url)
      return url.pathname
    } catch {
      return src.url
    }
  })()

  logRequest(providerKey, modelId, response.status, body.messages?.length || 0, latency, tokens, route)

  return NextResponse.json(data, { 
    status: response.status,
    headers: rateLimitHeaders,
  })
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
  request_id?: string
}

async function logRequest(providerKey: string, modelId: string, status: number, messagesCount: number, latency: number, tokens: number, route: string, requestId?: string) {
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
      request_id: requestId,
    }
    await appendFile(logPath, JSON.stringify(entry) + '\n', { flag: 'a' })
  } catch (error) {
    // Silent fail
  }
}