import { NextRequest, NextResponse } from 'next/server'
import { readConfig } from '@/lib/config'
import { sources } from '@/lib/sources'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ model_id: string }> }
) {
  try {
    const { model_id } = await params
    const fcmApiKey = request.headers.get('authorization')?.replace('Bearer ', '') || request.headers.get('x-api-key')
    const config = await readConfig()

    if (config.fcmProxyKey && fcmApiKey !== config.fcmProxyKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const model = findModel(model_id, config)

    if (!model) {
      return NextResponse.json({
        error: {
          message: `Model '${model_id}' not found`,
          type: 'invalid_request_error',
          param: 'model',
          code: 'model_not_found'
        }
      }, { status: 404 })
    }

    const favorites = new Set(config.favorites || [])

    return NextResponse.json({
      id: model.modelId,
      object: 'model',
      created: 1700000000,
      owned_by: model.providerKey,
      provider: model.providerKey,
      tier: model.tier,
      context_window: model.ctx,
      favorite: favorites.has(`${model.providerKey}/${model.modelId}`),
    })
  } catch (error) {
    console.error('Error getting model:', error)
    return NextResponse.json({ error: 'Failed to get model' }, { status: 500 })
  }
}

function findModel(modelId: string, config: any) {
  const allModels = Object.entries(sources)
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

  return allModels.find((m: any) => m.modelId === modelId)
}