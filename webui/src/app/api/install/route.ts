import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, appendFile } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { sources } from '@/lib/sources'

export async function POST(request: NextRequest) {
  try {
    const { providerKey, toolMode } = await request.json()
    const src = sources[providerKey]
    if (!src) return NextResponse.json({ error: 'Unknown provider' }, { status: 404 })

    const models = src.models.map(m => ({ id: m[0], label: m[1], tier: m[2] }))

    switch (toolMode) {
      case 'opencode':
      case 'opencode-desktop':
        await installOpenCode(providerKey, models)
        break
      case 'openclaw':
        await installOpenClaw(providerKey, models)
        break
      case 'crush':
        await installCrush(providerKey, models)
        break
      case 'goose':
        await installGoose(providerKey, models)
        break
      default:
        return NextResponse.json({ error: 'Unsupported tool' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Install error:', error)
    return NextResponse.json({ error: 'Installation failed' }, { status: 500 })
  }
}

async function installOpenCode(providerKey: string, models: any[]) {
  const home = homedir()
  const configDir = join(home, '.config', 'opencode')
  const configPath = join(configDir, 'opencode.json')
  await mkdir(configDir, { recursive: true })
  const existing = await readJsonSafe(configPath, { providers: [] })
  const newProvider = {
    key: `fcm-${providerKey}`,
    name: `FCM ${sources[providerKey].label}`,
    endpoint: '', // OpenCode computes automatically
    models: models.map(m => ({
      id: m.id,
      name: m.label,
      tier: m.tier,
    })),
  }
  existing.providers.push(newProvider)
  await writeFile(configPath, JSON.stringify(existing, null, 2))
}

async function installOpenClaw(providerKey: string, models: any[]) {
  const home = homedir()
  const configDir = join(home, '.openclaw')
  const configPath = join(configDir, 'openclaw.json')
  await mkdir(configDir, { recursive: true })
  const existing = await readJsonSafe(configPath, { providers: [] })
  const newProvider = {
    key: `fcm-${providerKey}`,
    name: `FCM ${sources[providerKey].label}`,
    endpoint: '',
    models: models.map(m => ({ id: m.id, name: m.label })),
  }
  existing.providers.push(newProvider)
  await writeFile(configPath, JSON.stringify(existing, null, 2))
}

async function installCrush(providerKey: string, models: any[]) {
  const home = homedir()
  const configDir = join(home, '.config', 'crush')
  const configPath = join(configDir, 'crush.json')
  await mkdir(configDir, { recursive: true })
  const existing = await readJsonSafe(configPath, { providers: [] })
  const newProvider = {
    key: `fcm-${providerKey}`,
    name: `FCM ${sources[providerKey].label}`,
    endpoint: '',
    models: models.map(m => ({ id: m.id, name: m.label })),
  }
  existing.providers.push(newProvider)
  await writeFile(configPath, JSON.stringify(existing, null, 2))
}

async function installGoose(providerKey: string, models: any[]) {
  const home = homedir()
  const providersDir = join(home, '.config', 'goose', 'custom_providers')
  const secretsPath = join(home, '.config', 'goose', 'secrets.yaml')
  await mkdir(providersDir, { recursive: true })
  const providerFile = join(providersDir, `${providerKey}.json`)
  const providerConfig = {
    key: `fcm-${providerKey}`,
    name: `FCM ${sources[providerKey].label}`,
    endpoint: '',
    models: models.map(m => ({ id: m.id, name: m.label })),
  }
  await writeFile(providerFile, JSON.stringify(providerConfig, null, 2))
  // Append API key to secrets.yaml (YAML format)
  const apiKey = '' // would need from config; for now, just note
  await appendFile(secretsPath, `\n${providerKey}_api_key: "${apiKey}"`)
}

async function readJsonSafe(path: string, fallback: any) {
  try {
    const data = await import('node:fs/promises').then(m => m.readFile(path, 'utf-8'))
    return JSON.parse(data)
  } catch {
    return fallback
  }
}