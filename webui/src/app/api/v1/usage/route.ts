import { NextRequest, NextResponse } from 'next/server'
import { readConfig } from '@/lib/config'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const fcmApiKey = authHeader?.replace('Bearer ', '') || request.headers.get('x-api-key')
    const config = await readConfig()

    if (config.fcmProxyKey && fcmApiKey !== config.fcmProxyKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const logPath = join(homedir(), '.free-coding-models-requests.jsonl')
    
    if (!existsSync(logPath)) {
      return NextResponse.json({
        object: 'usage',
        data: [],
        total_tokens: 0,
        total_requests: 0,
      })
    }

    const logs = readFileSync(logPath, 'utf-8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter(Boolean)

    // Aggregate by model
    const usageByModel: Record<string, { tokens: number; requests: number; latency_sum: number }> = {}
    const usageByProvider: Record<string, { tokens: number; requests: number; latency_sum: number }> = {}
    
    let totalTokens = 0
    let totalRequests = 0
    let totalLatency = 0

    for (const log of logs) {
      if (!log.tokens && log.tokens !== 0) continue
      
      const modelKey = `${log.provider}/${log.model}`
      
      if (!usageByModel[modelKey]) {
        usageByModel[modelKey] = { tokens: 0, requests: 0, latency_sum: 0 }
      }
      usageByModel[modelKey].tokens += log.tokens || 0
      usageByModel[modelKey].requests += 1
      usageByModel[modelKey].latency_sum += log.latency || 0

      if (!usageByProvider[log.provider]) {
        usageByProvider[log.provider] = { tokens: 0, requests: 0, latency_sum: 0 }
      }
      usageByProvider[log.provider].tokens += log.tokens || 0
      usageByProvider[log.provider].requests += 1
      usageByProvider[log.provider].latency_sum += log.latency || 0

      totalTokens += log.tokens || 0
      totalRequests += 1
      totalLatency += log.latency || 0
    }

    // Format for response
    const data = Object.entries(usageByModel).map(([model, stats]) => ({
      model,
      provider: model.split('/')[0],
      total_tokens: stats.tokens,
      total_requests: stats.requests,
      avg_latency_ms: Math.round(stats.latency_sum / stats.requests),
    })).sort((a, b) => b.total_tokens - a.total_tokens)

    const providers = Object.entries(usageByProvider).map(([provider, stats]) => ({
      provider,
      total_tokens: stats.tokens,
      total_requests: stats.requests,
      avg_latency_ms: Math.round(stats.latency_sum / stats.requests),
    })).sort((a, b) => b.total_tokens - a.total_tokens)

    return NextResponse.json({
      object: 'usage',
      data,
      providers,
      aggregated: {
        total_tokens: totalTokens,
        total_requests: totalRequests,
        avg_latency_ms: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
      },
      log_file: logPath,
    })
  } catch (error) {
    console.error('Usage error:', error)
    return NextResponse.json({ error: 'Failed to load usage' }, { status: 500 })
  }
}