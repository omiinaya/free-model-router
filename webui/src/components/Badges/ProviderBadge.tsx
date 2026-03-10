import { PROVIDER_COLORS } from '@/constants'

interface ProviderBadgeProps {
  providerKey: string
}

const PROVIDER_LABELS: Record<string, string> = {
  nvidia: 'NVIDIA',
  groq: 'Groq',
  cerebras: 'Cerebras',
  sambanova: 'SambaNova',
  openrouter: 'OpenRouter',
  huggingface: 'HuggingFace',
  replicate: 'Replicate',
  deepinfra: 'DeepInfra',
  fireworks: 'Fireworks',
  codestral: 'Codestral',
  hyperbolic: 'Hyperbolic',
  scaleway: 'Scaleway',
  googleai: 'Google AI',
  siliconflow: 'SiliconFlow',
  together: 'Together',
  cloudflare: 'Cloudflare',
  perplexity: 'Perplexity',
  qwen: 'Qwen',
  zai: 'ZAI',
  iflow: 'iFlow',
}

export function ProviderBadge({ providerKey }: ProviderBadgeProps) {
  const color = PROVIDER_COLORS[providerKey] || '#808080'
  const label = PROVIDER_LABELS[providerKey] || providerKey
  
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
      style={{ 
        backgroundColor: `${color}30`,
        color: color,
      }}
    >
      {label}
    </span>
  )
}