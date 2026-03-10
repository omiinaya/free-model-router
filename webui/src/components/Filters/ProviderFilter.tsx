'use client'

import { useApp } from '@/context/AppContext'
import { sources } from '@/lib/sources'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

export function ProviderFilter() {
  const { providerFilter, setProviderFilter } = useApp()

  const handleChange = (value: string | null) => {
    if (!value) {
      setProviderFilter(0)
      return
    }
    if (value === 'all') {
      setProviderFilter(0)
    } else {
      const providerKeys = Object.keys(sources)
      const idx = providerKeys.indexOf(value)
      if (idx !== -1) {
        // The filter value will be 1-indexed (1 = first provider)
        setProviderFilter(idx + 1)
      }
    }
  }

  const currentProviderKeys = Object.keys(sources)
  const currentValue = providerFilter === 0 ? 'all' : currentProviderKeys[providerFilter - 1] || 'all'

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="All providers" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Providers</SelectItem>
        {currentProviderKeys.map(pk => (
          <SelectItem key={pk} value={pk}>
            {PROVIDER_LABELS[pk] || pk}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}