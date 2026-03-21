import { readConfig } from './config'

// Simple in-memory rate limiting
// For production, consider using Redis or similar
const requestCounts: Map<string, { count: number; resetTime: number }> = new Map()

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
    }
  }
}, 60000)

export async function checkRateLimit(apiKey: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const config = await readConfig()
  
  // Check if rate limiting is enabled
  const rateLimitSettings = config.settings?.rateLimit
  if (!rateLimitSettings?.enabled) {
    return { allowed: true, remaining: -1, resetIn: 0 }
  }

  const limit = rateLimitSettings.requestsPerMinute || 60
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const key = `ratelimit:${apiKey}`
  
  let record = requestCounts.get(key)
  
  if (!record || now > record.resetTime) {
    // New window
    record = { count: 1, resetTime: now + windowMs }
    requestCounts.set(key, record)
    return { allowed: true, remaining: limit - 1, resetIn: windowMs }
  }
  
  // Check limit
  if (record.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: record.resetTime - now 
    }
  }
  
  // Increment count
  record.count++
  requestCounts.set(key, record)
  
  return { 
    allowed: true, 
    remaining: limit - record.count, 
    resetIn: record.resetTime - now 
  }
}

export function getRateLimitHeaders(remaining: number, resetIn: number): Record<string, string> {
  if (remaining < 0) {
    // Rate limiting disabled - return empty record
    const empty: Record<string, string> = {}
    return empty
  }
  
  return {
    'X-RateLimit-Limit': '60',
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000)),
  }
}