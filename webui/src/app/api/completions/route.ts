import { NextRequest, NextResponse } from 'next/server'
import { readConfig } from '@/lib/config'
import { sources } from '@/lib/sources'
import { getAvg, getStabilityScore, getUptime } from '@/lib/utils'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { appendFile } from 'node:fs/promises'

// GET /api/best - returns the best model according to current filters
export async function GET() {
  try {
    const config = await readConfig()
    
    // Get all models that are enabled and have API keys
    const enabledModels = Object.entries(sources)
      .filter(([providerKey]) => config.providers[providerKey]?.enabled !== false)
      .flatMap(([providerKey, src]) =>
        src.models.map(model => ({
          modelId: model[0],
          label: model[1],
          tier: model[2],
          sweScore: model[3],
          ctx: model[4],
          providerKey,
          status: 'pending' as const,
          pings: [] as any[],
          httpCode: null as string | null,
          isPinging: false,
          hidden: false,
          isFavorite: config.favorites.includes(`${providerKey}/${model[0]}`),
        }))
      )

    // Score models by multiple criteria
    const scored = enabledModels.map(m => ({
      ...m,
      score: computeModelScore(m, config),
    }))

    // Sort by score descending
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

function computeModelScore(m: any, config: any): number {
  // Weighted scoring:
  // - Favorite: +30
  // - Tier: S+ = 30, S = 25, A+ = 20, A = 15, A- = 10, B+ = 5, B = 3, C = 1
  // - Status: up/401 have small penalty based on avg (lower latency = higher score)
  
  let score = 0

  // Favorite bonus
  if (m.isFavorite) score += 30

  // Tier bonus
  const tierScores: Record<string, number> = {
    'S+': 30, 'S': 25, 'A+': 20, 'A': 15, 'A-': 10, 'B+': 5, 'B': 3, 'C': 1
  }
  score += tierScores[m.tier] || 0

  // Provider enabled/disabled: if disabled, huge penalty
  if (config.providers[m.providerKey]?.enabled === false) {
    score -= 1000
  }

  // TODO: incorporate actual ping data (avg, stability, uptime) when available
  // For now, rely on tier and favorites

  return score
}

// POST /api/completions - proxy to best model or specified model
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const bestHeader = request.headers.get('x-best')
    const modelHeader = request.headers.get('x-model')

    if (bestHeader === 'true') {
      // Auto-select best model
      const config = await readConfig()
      const enabledModels = Object.entries(sources)
        .filter(([providerKey]) => config.providers[providerKey]?.enabled !== false)
        .flatMap(([providerKey, src]) =>
          src.models.map(model => ({
            modelId: model[0],
            providerKey,
            apiKey: config.apiKeys[providerKey],
          }))
        )
        .filter(m => m.apiKey)

      if (enabledModels.length === 0) {
        return NextResponse.json({ error: 'No enabled providers with API keys' }, { status: 503 })
      }

      // Pick the first enabled provider for now (we'll improve by checking ping data)
      const selected = enabledModels[0]
      const apiKey = Array.isArray(selected.apiKey) ? selected.apiKey[0] : selected.apiKey

      return proxyRequest(selected.providerKey, selected.modelId, apiKey, body)
    } else if (modelHeader) {
      // Use specified model - need to parse provider from modelId
      const config = await readConfig()
      // Find which provider has this model
      for (const [providerKey, src] of Object.entries(sources)) {
        const hasModel = src.models.some((m: any) => m[0] === modelHeader)
        if (hasModel) {
          const rawKey = config.apiKeys[providerKey]
          if (rawKey) {
            const apiKey = Array.isArray(rawKey) ? rawKey[0] : rawKey
            return proxyRequest(providerKey, modelHeader, apiKey, body)
          }
        }
      }
      return NextResponse.json({ error: 'Model not found or no API key' }, { status: 404 })
    } else {
      return NextResponse.json({ error: 'Specify either X-Best: true or X-Model header' }, { status: 400 })
    }
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

  const response = await fetch(src.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...body,
      model: modelId,
    }),
  })

  // Log usage
  logRequest(providerKey, modelId, response.status, body.messages?.length || 0)

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

async function logRequest(providerKey: string, modelId: string, status: number, messagesCount: number) {
  try {
    const logPath = join(homedir(), '.free-coding-models-requests.jsonl')
    const entry = {
      timestamp: new Date().toISOString(),
      provider: providerKey,
      model: modelId,
      status,
      messages: messagesCount,
    }
    await appendFile(logPath, JSON.stringify(entry) + '\n', { flag: 'a' })
  } catch (error) {
    // Silent fail - logging shouldn't break functionality
  }
}