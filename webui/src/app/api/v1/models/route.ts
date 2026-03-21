import { NextRequest, NextResponse } from 'next/server'
import { readConfig } from '@/lib/config'
import { sources } from '@/lib/sources'
import { MODELS } from '@/lib/sources'

export async function GET(request: NextRequest) {
  try {
    const fcmApiKey = request.headers.get('authorization')?.replace('Bearer ', '') || request.headers.get('x-api-key')
    const config = await readConfig()

    if (config.fcmProxyKey && fcmApiKey !== config.fcmProxyKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const enabledModels = getEnabledModels(config)
    const favorites = new Set(config.favorites || [])

    const models = enabledModels
      .filter(m => m.apiKey)
      .map(m => ({
        id: m.modelId,
        object: 'model',
        created: 1700000000,
        owned_by: m.providerKey,
        provider: m.providerKey,
        tier: m.tier,
        context_window: m.ctx,
        favorite: favorites.has(`${m.providerKey}/${m.modelId}`),
      }))

    return NextResponse.json({
      object: 'list',
      data: models,
    })
  } catch (error) {
    console.error('Error listing models:', error)
    return NextResponse.json({ error: 'Failed to list models' }, { status: 500 })
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
        ctx: model[4],
        providerKey,
        apiKey: config.apiKeys[providerKey],
      }))
    )
    .filter((m: any) => m.apiKey)
}