import { NextRequest, NextResponse } from 'next/server'
import { readConfig } from '@/lib/config'
import { sources } from '@/lib/sources'
import { MODELS } from '@/lib/sources'
import { getAvg, getStabilityScore, getUptime, filterByTier } from '@/lib/utils'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { appendFile } from 'node:fs/promises'

// Simple in-memory round-robin state per pool
const roundRobinState: Map<string, number> = new Map()

// GET /api/best - returns the best model according to current filters
export async function GET(request: NextRequest) {
  try {
    const fcmApiKey = request.headers.get('x-api-key')
    const config = await readConfig()
    
    if (config.fcmProxyKey && fcmApiKey !== config.fcmProxyKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }
    
    const enabledModels = getEnabledModels(config)
    
    // Score models
    const scored = enabledModels.map(m => ({
      ...m,
      score: computeModelScore(m, config),
    }))
    
    scored.sort((a, b) => b.score - a.score)
    
    const best = scored[0]
    
    if (!best) {
      return NextResponse.json({ error: 'No models available' }, { status: 404 })
    }

    return NextResponse.json({
      modelId: best.modelId,
      label: best.label,
      providerKey: best.providerKey,
      tier: best.tier,
      score: best.score,
    })
  } catch (error) {
    console.error('Error getting best model:', error)
    return NextResponse.json({ error: 'Failed to get best model' }, { status: 500 })
  }
}

function getEnabledModels(config: any) {
  return Object.entries(sources)
    .filter(([providerKey]) => config.providers[providerKey]?.enabled !== false)
    .flatMap(([providerKey, src]) =>
      src.models.map(model => ({
        idx: -1,
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
        isFavorite: config.favorites.includes(`${providerKey}/${model[0]}`),
        apiKey: config.apiKeys[providerKey],
      }))
    )
    .filter(m => m.apiKey && !m.hidden)
}

function computeModelScore(m: any, config: any): number {
  let score = 0

  // Favorite bonus
  if (m.isFavorite) score += 30

  // Tier bonus
  const tierScores: Record<string, number> = {
    'S+': 30, 'S': 25, 'A+': 20, 'A': 15, 'A-': 10, 'B+': 5, 'B': 3, 'C': 1
  }
  score += tierScores[m.tier] || 0

  // Provider disabled penalty
  if (config.providers[m.providerKey]?.enabled === false) {
    score -= 1000
  }

  return score
}

function getPoolKey(pool: string, tierFilter?: string, providerFilter?: string): string {
  if (pool === 'all') return 'all'
  if (pool === 'group') {
    if (tierFilter && providerFilter) return `tier:${tierFilter}:prov:${providerFilter}`
    if (tierFilter) return `tier:${tierFilter}`
    if (providerFilter) return `prov:${providerFilter}`
    return 'all'
  }
  return pool
}

function selectModelRoundRobin(pool: string, candidates: any[], config: any): any | null {
  const poolKey = getPoolKey(pool)
  const idx = roundRobinState.get(poolKey) || 0
  const count = candidates.length
  
  if (count === 0) return null
  
  // Try up to count times to find a healthy model
  for (let i = 0; i < count; i++) {
    const candidate = candidates[(idx + i) % count]
    // Skip models without API key or hidden
    if (!candidate.apiKey || candidate.hidden) continue
    // Update state for next call
    roundRobinState.set(poolKey, (idx + i + 1) % count)
    return candidate
  }
  
  return null
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

// POST /api/completions - unified proxy endpoint
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate single FCM API key
    const fcmApiKey = request.headers.get('x-api-key')
    const config = await readConfig()
    
    if (!fcmApiKey) {
      return NextResponse.json({ error: 'Missing X-API-Key header' }, { status: 401 })
    }
    
    if (config.fcmProxyKey && fcmApiKey !== config.fcmProxyKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const body = await request.json()
    const modeHeader = request.headers.get('x-mode') || 'specific'
    const modelHeader = request.headers.get('x-model')
    const groupHeader = request.headers.get('x-group') // tier or provider filter (e.g., "S+", "groq", "S+:groq")
    const poolHeader = request.headers.get('x-pool') // for round-robin: "all", "tier=S+", "provider=groq"
    const bestHeader = request.headers.get('x-best') // legacy shortcut

    // Get all enabled models with API keys
    const allModels = getEnabledModels(config)
    
    // Start with all enabled models
    let pool = allModels

    // Apply group filter if provided (supports "S+", "groq", or "S+:groq")
    if (groupHeader) {
      const parts = groupHeader.split(':')
      if (parts[0]) {
        pool = pool.filter(m => m.tier === parts[0])
      }
      if (parts[1]) {
        pool = pool.filter(m => m.providerKey === parts[1])
      }
    }

    // Favorites always included (but we'll separate them for priority)
    const favorites = pool.filter(m => m.isFavorite)
    const nonFavorites = pool.filter(m => !m.isFavorite)

    let selected: any = null

    if (bestHeader === 'true') {
      // Legacy: global best
      selected = selectBestModel(pool, config)
    } else {
      switch (modeHeader) {
        case 'specific': {
          if (!modelHeader) {
            return NextResponse.json({ error: 'X-Model header required for mode=specific' }, { status: 400 })
          }
          // Find model in pool
          selected = pool.find(m => m.modelId === modelHeader)
          if (!selected) {
            return NextResponse.json({ error: 'Model not found or not available' }, { status: 404 })
          }
          break
        }
        case 'group': {
          // Select best from pool (respecting favorites priority)
          const combined = [...favorites, ...nonFavorites]
          selected = selectBestModel(combined, config) || selectBestModel(pool, config)
          break
        }
        case 'round-robin': {
          // Use pool header to determine pool scope, default to current filtered pool
          const poolSpec = poolHeader || (groupHeader ? `group:${groupHeader}` : 'all')
          const rrCandidates = [...favorites, ...nonFavorites] // favorites first but still rotate
          selected = selectModelRoundRobin(poolSpec, rrCandidates, config) || selectBestModel(rrCandidates, config)
          break
        }
        default:
          return NextResponse.json({ error: `Unknown mode: ${modeHeader}` }, { status: 400 })
      }
    }

    if (!selected) {
      return NextResponse.json({ error: 'No suitable model available for selection' }, { status: 503 })
    }

    // Proxy the request
    const apiKey = Array.isArray(selected.apiKey) ? selected.apiKey[0] : selected.apiKey
    return proxyRequest(selected.providerKey, selected.modelId, apiKey, body)
  } catch (error) {
    console.error('Completions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function proxyRequest(
  providerKey: string,
  modelId: string,
  apiKey: string,
  body: any
): Promise<NextResponse> {
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
    body: JSON.stringify({
      ...body,
      model: modelId,
    }),
  })
  const latency = Date.now() - startTime

  const data = await response.json()
  const tokens = data.usage?.total_tokens || 0
  // Extract route path from provider URL
  const route = (() => {
    try {
      const url = new URL(src.url)
      return url.pathname
    } catch {
      return src.url
    }
  })()

  // Log usage
  logRequest(providerKey, modelId, response.status, body.messages?.length || 0, latency, tokens, route)

  return NextResponse.json(data, { status: response.status })
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

async function logRequest(
  providerKey: string,
  modelId: string,
  status: number,
  messagesCount: number,
  latency: number,
  tokens: number,
  route: string
) {
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
    // Silent fail - logging shouldn't break functionality
  }
}
