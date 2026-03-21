import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export const TIER_ORDER = ['S+', 'S', 'A+', 'A', 'A-', 'B+', 'B', 'C']

export const TIER_LETTER_MAP: Record<string, string[]> = {
  'S': ['S+', 'S'],
  'A': ['A+', 'A', 'A-'],
  'B': ['B+', 'B'],
  'C': ['C'],
}

export const VERDICT_ORDER = ['Perfect', 'Normal', 'Slow', 'Spiky', 'Very Slow', 'Overloaded', 'Unstable', 'Not Active', 'Pending']

export const TIER_CYCLE = [null, 'S+', 'S', 'A+', 'A', 'A-', 'B+', 'B', 'C']

export const TIER_COLORS: Record<string, string> = {
  'S+': '#39ff14',
  'S': '#00ff00',
  'A+': '#00bfff',
  'A': '#00ffff',
  'A-': '#20b2aa',
  'B+': '#ffd700',
  'B': '#ffa500',
  'C': '#808080',
}

export const PROVIDER_COLORS: Record<string, string> = {
  nvidia: '#B2EBBE',
  groq: '#FFCCBC',
  cerebras: '#B3E5FC',
  sambanova: '#FFE0B2',
  openrouter: '#E1BEE7',
  huggingface: '#FFF59D',
  replicate: '#BBDEFB',
  deepinfra: '#B2DFDB',
  fireworks: '#FFCDD2',
  codestral: '#F8BBD9',
  hyperbolic: '#FFAB91',
  scaleway: '#81D4FA',
  googleai: '#BBDEFB',
  siliconflow: '#B2EBF2',
  together: '#FFF59D',
  cloudflare: '#FFE0B2',
  perplexity: '#F48FB1',
  qwen: '#FFE0B2',
  zai: '#AED5FF',
  iflow: '#DCE775',
}

export const PING_INTERVAL_MS = 1500 // Fixed ping interval

export const PING_TIMEOUT = 15000

export const FPS = 12

export const FRAMES = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']



export const TASK_TYPES: Record<string, { label: string; weights: { speed: number; quality: number; context: number; uptime: number; stability: number } }> = {
  quickfix: {
    label: 'Quick Fix',
    weights: { speed: 0.50, quality: 0.15, context: 0.05, uptime: 0.20, stability: 0.10 },
  },
  bugfix: {
    label: 'Bug Fix',
    weights: { speed: 0.15, quality: 0.40, context: 0.15, uptime: 0.15, stability: 0.15 },
  },
  feature: {
    label: 'Feature',
    weights: { speed: 0.10, quality: 0.35, context: 0.25, uptime: 0.15, stability: 0.15 },
  },
  refactor: {
    label: 'Refactor',
    weights: { speed: 0.10, quality: 0.35, context: 0.25, uptime: 0.15, stability: 0.15 },
  },
  review: {
    label: 'Review',
    weights: { speed: 0.10, quality: 0.30, context: 0.35, uptime: 0.15, stability: 0.10 },
  },
  document: {
    label: 'Document',
    weights: { speed: 0.20, quality: 0.25, context: 0.25, uptime: 0.15, stability: 0.15 },
  },
  explore: {
    label: 'Explore',
    weights: { speed: 0.25, quality: 0.15, context: 0.30, uptime: 0.15, stability: 0.15 },
  },
}

export const PRIORITY_TYPES: Record<string, { label: string; multipliers: { speed: number; quality: number; context: number; uptime: number; stability: number } }> = {
  speed: {
    label: 'Speed',
    multipliers: { speed: 2.0, quality: 0.5, context: 1.0, uptime: 1.0, stability: 1.0 },
  },
  quality: {
    label: 'Quality',
    multipliers: { speed: 0.5, quality: 2.0, context: 1.0, uptime: 1.0, stability: 1.0 },
  },
  balanced: {
    label: 'Balanced',
    multipliers: { speed: 1.0, quality: 1.0, context: 1.0, uptime: 1.0, stability: 1.0 },
  },
}

export const CONTEXT_BUDGETS: Record<string, { label: string; idealCtx: number; weightCtx: number }> = {
  small: { label: 'Small (<32k)', idealCtx: 32000, weightCtx: 0.2 },
  medium: { label: 'Medium (32-128k)', idealCtx: 128000, weightCtx: 0.5 },
  large: { label: 'Large (128-256k)', idealCtx: 256000, weightCtx: 0.8 },
  massive: { label: 'Massive (256k+)', idealCtx: 512000, weightCtx: 1.0 },
}

export const COLUMNS = [
  { key: 'rank', label: 'Rank', shortKey: 'R', width: 6 },
  { key: 'tier', label: 'Tier', shortKey: 'T', width: 6 },
  { key: 'swe', label: 'SWE%', shortKey: 'S', width: 9 },
  { key: 'ctx', label: 'CTX', shortKey: 'C', width: 6 },
  { key: 'model', label: 'Model', shortKey: 'M', width: 26 },
  { key: 'provider', label: 'Provider', shortKey: 'O', width: 14 },
  { key: 'latest', label: 'Latest', shortKey: 'L', width: 14 },
  { key: 'avg', label: 'Avg Ping', shortKey: 'A', width: 11 },
  { key: 'status', label: 'Health', shortKey: 'H', width: 18 },
  { key: 'verdict', label: 'Verdict', shortKey: 'V', width: 14 },
  { key: 'stability', label: 'Stability', shortKey: 'B', width: 11 },
  { key: 'uptime', label: 'Up%', shortKey: 'U', width: 6 },
  { key: 'used', label: 'Used', shortKey: '', width: 7 },
  { key: 'usage', label: 'Usage', shortKey: 'G', width: 7 },
] as const