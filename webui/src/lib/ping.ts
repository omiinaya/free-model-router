import type { ModelResult } from '@/types'
import { PING_TIMEOUT, PING_INTERVAL_MS } from '@/constants'

interface PingResult {
  ms: number
  code: string
  quotaPercent?: number
}

export async function pingModel(
  providerKey: string,
  modelId: string,
  apiKey?: string
): Promise<PingResult> {
  const start = Date.now()
  
  try {
    const response = await fetch('/api/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerKey,
        modelId,
        apiKey,
      }),
    })
    
    const data = await response.json()
    return {
      ms: Date.now() - start,
      code: String(data.code || '500'),
      quotaPercent: data.quotaPercent,
    }
  } catch (error) {
    return {
      ms: Date.now() - start,
      code: '500',
    }
  }
}

export function startPingLoop(
  results: ModelResult[],
  onPingComplete: (modelId: string, result: PingResult) => void,
  visibleResults: ModelResult[],
  isPaused: () => boolean,
  onCycleComplete?: () => void
): () => void {
  let isRunning = true
  let pingIndex = 0
  
  const processBatch = async () => {
    if (!isRunning || isPaused()) return
    
    // Only ping visible models (not off-screen)
    const visibleModelIds = new Set(visibleResults.map(r => r.modelId))
    const modelsToPing = results.filter(r => 
      visibleModelIds.has(r.modelId) && !r.hidden
    )
    
    if (modelsToPing.length === 0) return
    
    // Ping 5 models at a time (staggered batches)
    const batchSize = Math.min(5, modelsToPing.length)
    const startIdx = pingIndex % modelsToPing.length
    const batchModels = []
    
    for (let i = 0; i < batchSize; i++) {
      const idx = (startIdx + i) % modelsToPing.length
      batchModels.push(modelsToPing[idx])
    }
    
    pingIndex = (startIdx + batchSize) % modelsToPing.length
    
    // Ping batch in parallel
    const pingPromises = batchModels.map(r => 
      pingModel(r.providerKey, r.modelId)
        .then(result => ({ modelId: r.modelId, result }))
        .catch(() => ({ modelId: r.modelId, result: { ms: 0, code: '500' } as PingResult }))
    )
    
    const pingResults = await Promise.all(pingPromises)
    
    pingResults.forEach(({ modelId, result }) => {
      onPingComplete(modelId, result)
    })
    
    onCycleComplete?.()
  }
  
  const interval = setInterval(processBatch, PING_INTERVAL_MS)
  processBatch() // Immediate first batch
  
  return () => {
    isRunning = false
    clearInterval(interval)
  }
}