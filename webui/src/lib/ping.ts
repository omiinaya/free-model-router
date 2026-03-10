import type { ModelResult } from '@/types'
import { PING_TIMEOUT } from '@/constants'

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
  mode: 'speed' | 'normal' | 'slow' | 'forced',
  isPaused: () => boolean,
  onCycleComplete?: () => void
): () => void {
  const getInterval = () => {
    switch (mode) {
      case 'speed': return 2000
      case 'normal': return 10000
      case 'slow': return 30000
      case 'forced': return 4000
      default: return 10000
    }
  }

  let isRunning = true

  const processQueue = async () => {
    if (!isRunning || isPaused()) return

    // Get models that need pinging (either never pinged or stale > 1.5x interval)
    const now = Date.now()
    const intervalMs = getInterval()
    const modelsToPing: ModelResult[] = results.filter(r => {
      if (r.hidden) return false
      const lastPing = r.pings.length > 0 ? r.pings[r.pings.length - 1] : null
      if (!lastPing) return true
      return now - lastPing.ms > intervalMs * 1.5
    })

    if (modelsToPing.length === 0) return

    // Ping all models in parallel
    const pingPromises = modelsToPing.map(r => 
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

  const interval = setInterval(processQueue, getInterval())
  // Speed mode: ping aggressively for first 60 seconds
  if (mode === 'speed') {
    const speedInterval = setInterval(processQueue, 2000)
    setTimeout(() => {
      clearInterval(speedInterval)
    }, 60000)
  }
  processQueue() // Immediate first ping

  return () => {
    isRunning = false
    clearInterval(interval)
  }
}