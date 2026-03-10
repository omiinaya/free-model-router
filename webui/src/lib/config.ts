import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'

export const CONFIG_PATH = join(homedir(), '.free-coding-models.json')

export interface Config {
  apiKeys: Record<string, string | string[]>
  providers: Record<string, { enabled: boolean }>
  favorites: string[]
  settings?: Record<string, any>
}

export async function readConfig(): Promise<Config> {
  try {
    const data = await readFile(CONFIG_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        apiKeys: {},
        providers: {},
        favorites: [],
        settings: {},
      }
    }
    throw error
  }
}

export async function writeConfig(config: Config): Promise<void> {
  const dir = dirname(CONFIG_PATH)
  await mkdir(dir, { recursive: true })
  const data = JSON.stringify(config, null, 2)
  await writeFile(CONFIG_PATH, data, { mode: 0o600 })
}

export function getApiKey(config: Config, providerKey: string): string | undefined {
  const keys = config.apiKeys[providerKey]
  if (!keys) return undefined
  if (typeof keys === 'string') return keys
  if (Array.isArray(keys) && keys.length > 0) return keys[0]
  return undefined
}

export function isProviderEnabled(config: Config, providerKey: string): boolean {
  return config.providers[providerKey]?.enabled !== false
}