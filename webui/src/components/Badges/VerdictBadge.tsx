interface VerdictBadgeProps {
  verdict: string
}

const VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'Perfect': { label: 'Perfect', color: 'text-green-400', bg: 'bg-green-400/10' },
  'Normal': { label: 'Normal', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  'Slow': { label: 'Slow', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  'Spiky': { label: 'Spiky', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  'Very Slow': { label: 'Very Slow', color: 'text-red-400', bg: 'bg-red-400/10' },
  'Overloaded': { label: 'Overloaded', color: 'text-red-500', bg: 'bg-red-500/10' },
  'Unstable': { label: 'Unstable', color: 'text-red-400', bg: 'bg-red-400/10' },
  'Not Active': { label: 'Not Active', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  'Pending': { label: 'Pending', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
}

export function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const config = VERDICT_CONFIG[verdict] || { label: verdict, color: 'text-gray-400', bg: 'bg-gray-400/10' }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  )
}