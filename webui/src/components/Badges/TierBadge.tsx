import { TIER_COLORS } from '@/constants'

interface TierBadgeProps {
  tier: string
}

export function TierBadge({ tier }: TierBadgeProps) {
  const color = TIER_COLORS[tier] || '#808080'
  
  return (
    <span
      className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded"
      style={{ 
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {tier}
    </span>
  )
}