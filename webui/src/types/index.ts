export interface ModelPing {
  ms: number
  code: string
}

export interface ModelResult {
  idx: number
  modelId: string
  label: string
  tier: string
  sweScore: string
  ctx: string
  providerKey: string
  status: 'pending' | 'up' | 'down' | 'timeout' | 'noauth'
  pings: ModelPing[]
  httpCode: string | null
  isPinging: boolean
  hidden: boolean
  isFavorite: boolean
  isRecommended: boolean
  recommendScore: number
  usagePercent?: number
  totalTokens?: number
}

export interface Config {
  apiKeys: Record<string, string | string[]>
  providers: Record<string, { enabled: boolean }>
  favorites: string[]
  telemetry?: {
    enabled: boolean
    consentVersion?: number
    anonymousId?: string
  }
  activeProfile: string | null
  profiles: Record<string, Profile>
  settings?: AppSettings
  endpointInstalls?: EndpointInstall[]
  fcmProxyKey?: string
}

export interface Profile {
  apiKeys: Record<string, string | string[]>
  providers: Record<string, { enabled: boolean }>
  favorites: string[]
  settings: AppSettings
}

export interface AppSettings {
  tierFilter?: string | null
  sortColumn?: string
  sortAsc?: boolean
  pingInterval?: number
  hideUnconfiguredModels?: boolean
  preferredToolMode?: string
  proxy?: {
    enabled?: boolean
    syncToOpenCode?: boolean
    preferredPort?: number
  }
}

export interface EndpointInstall {
  providerKey: string
  toolMode: string
  scope: string
  modelIds: string[]
  lastSyncedAt: string
}

export type SortColumn = 'rank' | 'tier' | 'swe' | 'ctx' | 'origin' | 'model' | 'ping' | 'avg' | 'status' | 'verdict' | 'stability' | 'uptime' | 'usage'

export type SortDirection = 'asc' | 'desc'

export type PingMode = 'speed' | 'normal' | 'slow' | 'forced'

export type ToolMode = 'opencode' | 'opencode-desktop' | 'openclaw' | 'crush' | 'goose'

export interface ProviderInfo {
  label: string
  name: string
  url: string
  models: [string, string, string, string, string][]
}

export interface TaskType {
  label: string
  weights: {
    speed: number
    quality: number
    context: number
    uptime: number
    stability: number
  }
}

export interface PriorityType {
  label: string
  multipliers: {
    speed: number
    quality: number
    context: number
    uptime: number
    stability: number
  }
}

export interface ContextBudget {
  label: string
  idealCtx: number
  weightCtx: number
}

export interface Recommendation {
  result: ModelResult
  score: number
}