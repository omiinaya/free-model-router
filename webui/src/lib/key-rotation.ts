const keyCursor: Map<string, number> = new Map()

export function getApiKeyForProvider(providerKey: string, apiKeys: Record<string, string | string[]>): string | undefined {
  const keys = apiKeys[providerKey]
  if (!keys) return undefined
  if (typeof keys === 'string') return keys
  if (Array.isArray(keys) && keys.length > 0) {
    const cursor = keyCursor.get(providerKey) || 0
    const key = keys[cursor % keys.length]
    keyCursor.set(providerKey, (cursor + 1) % keys.length)
    return key
  }
  return undefined
}

export function getKeyCount(providerKey: string, apiKeys: Record<string, string | string[]>): number {
  const keys = apiKeys[providerKey]
  if (!keys) return 0
  if (typeof keys === 'string') return 1
  if (Array.isArray(keys)) return keys.length
  return 0
}

export function hasMultipleKeys(providerKey: string, apiKeys: Record<string, string | string[]>): boolean {
  return getKeyCount(providerKey, apiKeys) > 1
}

export function resetKeyCursor(providerKey?: string): void {
  if (providerKey) {
    keyCursor.delete(providerKey)
  } else {
    keyCursor.clear()
  }
}