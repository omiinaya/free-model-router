interface StatusBadgeProps {
  status: 'pending' | 'up' | 'down' | 'timeout' | 'noauth'
}

const STATUS_CONFIG = {
  pending: { icon: '⏳', label: 'Pending', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  up: { icon: '✅', label: 'UP', color: 'text-green-500', bg: 'bg-green-500/10' },
  down: { icon: '❌', label: 'ERR', color: 'text-red-500', bg: 'bg-red-500/10' },
  timeout: { icon: '⏱', label: 'TIMEOUT', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  noauth: { icon: '🔑', label: 'NO KEY', color: 'text-gray-500', bg: 'bg-gray-500/10' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${config.bg} ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}