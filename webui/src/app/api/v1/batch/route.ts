import { NextRequest, NextResponse } from 'next/server'
import { readConfig } from '@/lib/config'
import { sources } from '@/lib/sources'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { appendFile } from 'node:fs/promises'

const roundRobinState: Map<string, number> = new Map()

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
    const { requests, mode = 'parallel' } = body

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return NextResponse.json({ 
        error: { message: 'Missing required parameter: requests (array)', type: 'invalid_request_error', param: 'requests' }
      }, { status: 400 })
    }

    // Limit batch size
    const maxBatchSize = 10
    if (requests.length > maxBatchSize) {
      return NextResponse.json({ 
        error: { message: `Batch too large. Maximum ${maxBatchSize} requests per batch.`, type: 'invalid_request_error', param: 'requests' }
      }, { status: 400 })
    }

    const results = await processBatch(requests, config, mode)

    return NextResponse.json({
      object: 'batch',
      data: results,
      batch_size: requests.length,
      processed_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Batch error:', error)
    return NextResponse.json({ 
      error: { message: 'Internal server error', type: 'server_error' }
    }, { status: 500 })
  }
}

async function processBatch(requests: any[], config: any, mode: string) {
  const results: any[] = []

  if (mode === 'parallel') {
    // Process all requests in parallel
    const promises = requests.map(req => processRequest(req, config))
    results.push(...await Promise.all(promises))
  } else {
    // Process sequentially
    for (const req of requests) {
      results.push(await processRequest(req, config))
    }
  }

  return results
}

async function processRequest(req: any, config: any) {
  const requestId = generateRequestId()
  
  try {
    // Extract parameters from request
    const messages = req.messages || []
    const model = req.model
    const temperature = req.temperature
    const max_tokens = req.max_tokens

    // Get model selection logic
    const allModels = getEnabledModels(config)
    let pool = allModels

    const favorites = pool.filter(m => m.isFavorite)
    const nonFavorites = pool.filter(m => !m.isFavorite)

    let selected: any = null

    if (model) {
      selected = pool.find(m => m.modelId === model)
    } else {
      const defaultPool = favorites.length > 0 ? favorites : pool
      selected = selectBestModel(defaultPool, config)
    }

    if (!selected) {
      return {
        request_id: requestId,
        error: { message: 'No suitable model available', type: 'server_error' },
        status: 'failed',
      }
    }

    const apiKey = Array.isArray(selected.apiKey) ? selected.apiKey[0] : selected.apiKey
    
    // Make the actual API call
    const src = sources[selected.providerKey]
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }

    if (selected.providerKey === 'openrouter') {
      headers['HTTP-Referer'] = 'https://github.com/vava-nessa/free-coding-models'
      headers['X-Title'] = 'free-coding-models'
    }

    const providerBody: any = {
      model: selected.modelId,
      messages,
    }
    if (temperature !== undefined) providerBody.temperature = temperature
    if (max_tokens !== undefined) providerBody.max_tokens = max_tokens

    const startTime = Date.now()
    const response = await fetch(src.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(providerBody),
    })
    const latency = Date.now() - startTime

    const data = await response.json()
    const tokens = data.usage?.total_tokens || 0

    // Log the request
    logRequest(selected.providerKey, selected.modelId, response.status, messages.length, latency, tokens, '/v1/batch', requestId)

    return {
      request_id: requestId,
      model: selected.modelId,
      provider: selected.providerKey,
      status: response.ok ? 'completed' : 'failed',
      response: data,
      latency_ms: latency,
      tokens,
    }
  } catch (error: any) {
    return {
      request_id: requestId,
      error: { message: error.message || 'Request failed', type: 'server_error' },
      status: 'failed',
    }
  }
}

function generateRequestId(): string {
  return 'req_' + Math.random().toString(36).slice(2, 15)
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
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.sweScore !== a.sweScore) return b.sweScore - a.sweScore
    const tierOrder: Record<string, number> = { 'S+': 8, 'S': 7, 'A+': 6, 'A': 5, 'A-': 4, 'B+': 3, 'B': 2, 'C': 1 }
    return (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0)
  })
  return scored[0] || null
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