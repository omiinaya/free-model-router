'use client'

import { useApp } from '@/context/AppContext'
import { TIER_CYCLE, TIER_COLORS } from '@/constants'

export function TierFilter() {
  const { tierFilter, setTierFilter } = useApp()

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setTierFilter(0)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          tierFilter === 0 
            ? 'bg-zinc-700 text-zinc-300' 
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
        }`}
      >
        All
      </button>
      {TIER_CYCLE.slice(1).map((tier, idx) => {
        const filterIndex = idx + 1
        const isActive = tierFilter === filterIndex
        const color = TIER_COLORS[tier!] || '#808080'
        
        return (
          <button
            key={tier}
            onClick={() => setTierFilter(filterIndex)}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={{
              backgroundColor: isActive ? `${color}30` : '',
              color: isActive ? color : '',
              border: isActive ? `1px solid ${color}50` : '1px solid transparent',
            }}
          >
            {tier}
          </button>
        )
      })}
    </div>
  )
}