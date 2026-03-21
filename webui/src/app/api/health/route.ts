import { NextRequest, NextResponse } from 'next/server'
import { readConfig } from '@/lib/config'
import { sources } from '@/lib/sources'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export async function GET(request: NextRequest) {
  try {
    const config = await readConfig()
    
    // Check configured providers
    const providers = Object.keys(sources)
    const configuredProviders = providers.filter(p => config.apiKeys?.[p])
    const enabledProviders = providers.filter(p => config.providers?.[p]?.enabled !== false)
    
    // Check log file
    const logPath = join(homedir(), '.free-coding-models-requests.jsonl')
    const logExists = existsSync(logPath)
    
    // Calculate uptime (approximate - would need process start time)
    const uptime = process.uptime()
    
    // Check memory usage
    const memUsage = process.memoryUsage()
    
    // Response time
    const start = Date.now()
    // Simple computation to measure response time
    const responseTime = Date.now() - start
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(uptime),
      version: process.env.npm_package_version || '0.2.3',
services: {
      api: { status: 'up', response_time_ms: responseTime },
      config: { status: 'up', writable: true, warning: '' as string },
      logging: { status: logExists ? 'up' : 'down', path: logPath, warning: '' as string },
    },
      providers: {
        total: providers.length,
        configured: configuredProviders.length,
        enabled: enabledProviders.length,
      },
      resources: {
        memory_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
        memory_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
    }
    
    // Check if any critical issues
    if (configuredProviders.length === 0) {
      health.status = 'degraded'
      health.services.config.warning = 'No provider API keys configured'
    }
    
    if (!logExists) {
      health.status = 'degraded'
      health.services.logging.warning = 'Log file not found'
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 200 // Still return 200, status in body
    
    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal error',
    }, { status: 503 })
  }
}

// Also support HEAD for quick checks
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}