import { NextRequest, NextResponse } from 'next/server'
import { sources } from '@/lib/sources'
import { readConfig, getApiKey } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const { providerKey, modelId, apiKey: providedKey } = await request.json()

    if (!providerKey || !modelId) {
      return NextResponse.json({ error: 'Missing providerKey or modelId' }, { status: 400 })
    }

    const src = sources[providerKey]
    if (!src) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 404 })
    }

    // Get API key: use provided, then read from config file
    let key = providedKey
    if (!key) {
      const config = await readConfig()
      const keyFromConfig = getApiKey(config, providerKey)
      if (!keyFromConfig) {
        return NextResponse.json({ code: '401', ms: 0, quotaPercent: undefined })
      }
      key = keyFromConfig
    }

     // Build provider-specific request
     const result = await pingProvider(providerKey, src, modelId, key!)
     return NextResponse.json(result)
  } catch (error) {
    console.error('Ping error:', error)
    return NextResponse.json({ code: '500', ms: 0, quotaPercent: undefined })
  }
}

async function pingProvider(
  providerKey: string,
  src: { url: string; models: any[] },
  modelId: string,
  apiKey: string
): Promise<{ ms: number; code: string; quotaPercent?: number }> {
  const start = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    // Most providers use OpenAI-compatible format
    const body = JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 1,
      stream: false,
    })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }

    // Provider-specific header adjustments
    if (providerKey === 'openrouter') {
      headers['HTTP-Referer'] = 'https://github.com/vava-nessa/free-coding-models'
      headers['X-Title'] = 'free-coding-models'
    }

    const response = await fetch(src.url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal as any,
    })

    const ms = Date.now() - start
    clearTimeout(timeoutId)

    let quotaPercent: number | undefined
    if (response.headers.has('x-ratelimit-remaining')) {
      const remaining = response.headers.get('x-ratelimit-remaining')
      if (remaining) {
        // Try to infer quota percent (many providers don't expose this)
        // We'll leave it undefined for now
      }
    }

    return {
      ms,
      code: String(response.status),
      quotaPercent,
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      return { ms: 15000, code: '408' }
    }
    
    return { ms: Date.now() - start, code: '500' }
  }
}