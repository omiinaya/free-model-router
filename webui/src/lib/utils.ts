import { type ClassValue, clsx } from "clsx"
import type { ModelResult, SortColumn, SortDirection, Recommendation } from '@/types'
import { TIER_ORDER, VERDICT_ORDER, TIER_LETTER_MAP, TASK_TYPES, PRIORITY_TYPES, CONTEXT_BUDGETS } from '@/constants'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

const measurablePingCodes = new Set(['200', '401'])

export function getAvg(r: ModelResult): number {
  const measurablePings = (r.pings || []).filter(p => measurablePingCodes.has(p.code))
  if (measurablePings.length === 0) return Infinity
  return Math.round(measurablePings.reduce((a, b) => a + b.ms, 0) / measurablePings.length)
}

export function getVerdict(r: ModelResult): string {
  const code = r.httpCode
  const avg = getAvg(r)
  const pings = r.pings || []
  const successfulPings = pings.filter(p => p.code === '200')
  
  if (code === '429') return 'Overloaded'
  
  if (avg === Infinity) {
    if (r.status === 'up' && successfulPings.length === 0) return 'Pending'
    if (r.status === 'timeout' && successfulPings.length > 0) return 'Unstable'
    return 'Not Active'
  }
  
  if (avg < 400) {
    const p95 = getP95(r)
    if (pings.length >= 3 && p95 >= avg * 3) return 'Spiky'
    return 'Perfect'
  }
  if (avg < 1000) return 'Normal'
  if (avg < 3000) return 'Slow'
  return 'Very Slow'
}

export function getUptime(r: ModelResult): number {
  const pings = r.pings || []
  if (pings.length === 0) return 0
  const successful = pings.filter(p => p.code === '200').length
  return Math.round((successful / pings.length) * 100)
}

export function getP95(r: ModelResult): number {
  const successfulPings = (r.pings || []).filter(p => measurablePingCodes.has(p.code))
  if (successfulPings.length === 0) return Infinity
  
  const sorted = [...successfulPings].sort((a, b) => a.ms - b.ms)
  const idx = Math.ceil(sorted.length * 0.95) - 1
  return sorted[Math.max(0, idx)]?.ms ?? Infinity
}

export function getJitter(r: ModelResult): number {
  const successfulPings = (r.pings || []).filter(p => measurablePingCodes.has(p.code))
  if (successfulPings.length < 2) return 0
  
  const avg = successfulPings.reduce((a, b) => a + b.ms, 0) / successfulPings.length
  const squaredDiffs = successfulPings.map(p => Math.pow(p.ms - avg, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / successfulPings.length
  return Math.round(Math.sqrt(variance))
}

export function getStabilityScore(r: ModelResult): number {
  const avg = getAvg(r)
  if (avg === Infinity) return -1

  const p95 = getP95(r)
  const jitter = getJitter(r)
  const uptime = getUptime(r)

  const pings = r.pings || []
  if (pings.length === 0) return -1
  const spikes = pings.filter(p => p.ms > avg * 2).length
  const spikeRate = pings.length > 0 ? spikes / pings.length : 0

  const p95Score = Math.max(0, 100 - (p95 / 50))
  const jitterScore = Math.max(0, 100 - (jitter / 20))
  const spikePenalty = spikeRate * 50
  const uptimeScore = uptime

  return Math.round(Math.max(0, Math.min(100, (p95Score * 0.3) + (jitterScore * 0.2) + uptimeScore * 0.5 - spikePenalty)))
}

export function sortResults(
  results: ModelResult[],
  sortColumn: SortColumn,
  sortDirection: SortDirection
): ModelResult[] {
  const sorted = [...results].sort((a, b) => {
    let aVal: string | number
    let bVal: string | number
    
    switch (sortColumn) {
      case 'rank':
        aVal = TIER_ORDER.indexOf(a.tier)
        bVal = TIER_ORDER.indexOf(b.tier)
        break
      case 'tier':
        aVal = TIER_ORDER.indexOf(a.tier)
        bVal = TIER_ORDER.indexOf(b.tier)
        break
      case 'origin':
        aVal = a.providerKey
        bVal = b.providerKey
        break
      case 'model':
        aVal = a.label.toLowerCase()
        bVal = b.label.toLowerCase()
        break
      case 'ping':
        aVal = a.pings.length > 0 ? a.pings[a.pings.length - 1].ms : Infinity
        bVal = b.pings.length > 0 ? b.pings[b.pings.length - 1].ms : Infinity
        break
      case 'avg':
        aVal = getAvg(a)
        bVal = getAvg(b)
        break
      case 'status':
        aVal = a.status === 'up' ? 0 : a.status === 'pending' ? 1 : 2
        bVal = b.status === 'up' ? 0 : b.status === 'pending' ? 1 : 2
        break
      case 'verdict':
        aVal = VERDICT_ORDER.indexOf(getVerdict(a))
        bVal = VERDICT_ORDER.indexOf(getVerdict(b))
        break
      case 'stability':
        aVal = getStabilityScore(a)
        bVal = getStabilityScore(b)
        break
      case 'uptime':
        aVal = getUptime(a)
        bVal = getUptime(b)
        break
      case 'used':
        aVal = a.totalTokens ?? 0
        bVal = b.totalTokens ?? 0
        break
      case 'usage':
        aVal = a.usagePercent ?? 0
        bVal = b.usagePercent ?? 0
        break
      default:
        aVal = 0
        bVal = 0
    }
    
if (typeof aVal === 'string' && typeof bVal === 'string') {
  return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
}

let aNum = typeof aVal === 'number' ? aVal : 0
let bNum = typeof bVal === 'number' ? bVal : 0

if (aNum === Infinity) aNum = 999999
if (bNum === Infinity) bNum = 999999

return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
  })
  
  const favorites = sorted.filter(r => r.isFavorite)
  const nonFavorites = sorted.filter(r => !r.isFavorite)
  
  return [...favorites, ...nonFavorites]
}

export function filterByTier(results: ModelResult[], tierLetter: string): ModelResult[] | null {
  if (!tierLetter) return null
  const allowed = TIER_LETTER_MAP[tierLetter]
  if (!allowed) return null
  return results.filter(r => allowed.includes(r.tier))
}

export function findBestModel(results: ModelResult[]): ModelResult | null {
  const up = results.filter(r => r.status === 'up')
  if (up.length === 0) return null
  
  return up.reduce((best, current) => {
    const bestAvg = getAvg(best)
    const currentAvg = getAvg(current)
    
    if (currentAvg < bestAvg) return current
    if (currentAvg > bestAvg) return best
    
    const bestUptime = getUptime(best)
    const currentUptime = getUptime(current)
    if (currentUptime > bestUptime) return current
    
    const bestStability = getStabilityScore(best)
    const currentStability = getStabilityScore(current)
    if (currentStability > bestStability) return current
    
    return best
  })
}

export function scoreModelForTask(
  r: ModelResult,
  taskType: string,
  priority: string,
  contextBudget: string
): number {
  if (!TASK_TYPES[taskType] || !PRIORITY_TYPES[priority] || !CONTEXT_BUDGETS[contextBudget]) {
    return 0
  }
  
  if (r.status === 'down' || r.status === 'timeout') return 0
  
  const task = TASK_TYPES[taskType]
  const priorityMul = PRIORITY_TYPES[priority].multipliers
  const ctxBudget = CONTEXT_BUDGETS[contextBudget]
  
  let score = 0
  const avg = getAvg(r)
  const stability = getStabilityScore(r)
  const uptime = getUptime(r)
  
  const ctxValue = parseCtxValue(r.ctx)
  const ctxScore = ctxValue >= ctxBudget.idealCtx ? 100 : (ctxValue / ctxBudget.idealCtx) * 100
  
  const speedScore = avg === Infinity ? 0 : Math.max(0, 100 - avg / 20)
  const qualityScore = parseFloat(r.sweScore) || 0
  
  score += speedScore * task.weights.speed * priorityMul.speed
  score += qualityScore * task.weights.quality * priorityMul.quality
  score += ctxScore * task.weights.context * ctxBudget.weightCtx
  score += uptime * task.weights.uptime * priorityMul.uptime
  score += stability * task.weights.stability * priorityMul.stability
  
  return Math.round(Math.max(0, Math.min(100, score)))
}

export function getTopRecommendations(
  results: ModelResult[],
  taskType: string,
  priority: string,
  contextBudget: string,
  topN: number = 3
): Recommendation[] {
  const scored = results
    .filter(r => !r.hidden)
    .map(r => ({
      result: r,
      score: scoreModelForTask(r, taskType, priority, contextBudget)
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
  
  return scored.slice(0, topN)
}

function parseCtxValue(ctx: string): number {
  if (!ctx) return 0
  const match = ctx.match(/(\d+)([km])?/i)
  if (!match) return 0
  let value = parseInt(match[1])
  const unit = match[2]?.toLowerCase()
  if (unit === 'k') value *= 1000
  if (unit === 'm') value *= 1000000
  return value
}

export function formatCtxWindow(value: number): string {
  if (!value || value <= 0) return '128k'
  if (value >= 1000000) return `${Math.round(value / 1000000)}M`
  if (value >= 1000) return `${Math.round(value / 1000)}k`
  return String(value)
}

export function formatTokenTotal(totalTokens: number | undefined): string {
  if (totalTokens === undefined || totalTokens === null) return '--'
  if (totalTokens < 0) return '--'
  if (totalTokens === 0) return '0'
  if (totalTokens >= 999500) return `${(totalTokens / 1000000).toFixed(2)}M`
  if (totalTokens >= 1000) return `${(totalTokens / 1000).toFixed(2)}k`
  return String(Math.floor(totalTokens))
}

export function toFavoriteKey(providerKey: string, modelId: string): string {
  return `${providerKey}/${modelId}`
}