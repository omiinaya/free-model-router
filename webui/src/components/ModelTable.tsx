'use client'

import { useApp } from '@/context/AppContext'
import { TierBadge } from '@/components/Badges/TierBadge'
import { StatusBadge } from '@/components/Badges/StatusBadge'
import { ProviderBadge } from '@/components/Badges/ProviderBadge'
import { VerdictBadge } from '@/components/Badges/VerdictBadge'
import { getAvg, getUptime, getStabilityScore, getVerdict, formatTokenTotal } from '@/lib/utils'
import { COLUMNS } from '@/constants'
import { useCallback, useEffect, useRef, useState } from 'react'

export function ModelTable() {
  const { 
    visibleResults, 
    cursor, 
    setCursor, 
    setSort, 
    sortColumn, 
    sortDirection,
    toggleFavorite,
  } = useApp()

  const tableRef = useRef<HTMLDivElement>(null)

  const handleSort = (column: string) => {
    setSort(column as any)
  }

  const renderCell = (r: typeof visibleResults[number], col: typeof COLUMNS[number]) => {
    switch (col.key) {
      case 'rank':
        return <span className="font-mono text-zinc-400 text-sm">#{r.idx}</span>
      case 'tier':
        return <TierBadge tier={r.tier} />
      case 'swe':
        return <span className="font-mono text-zinc-300 text-sm">{r.sweScore}</span>
      case 'ctx':
        return <span className="font-mono text-zinc-400 text-sm">{r.ctx}</span>
      case 'model':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(r.providerKey, r.modelId)
              }}
              className="text-lg focus:outline-none hover:scale-110 transition-transform"
              aria-label={r.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {r.isFavorite ? '⭐' : '☆'}
            </button>
            <span className="text-white font-medium truncate max-w-[200px]">{r.label}</span>
          </div>
        )
      case 'provider':
        return <ProviderBadge providerKey={r.providerKey} />
      case 'latest':
        if (r.isPinging) {
          return <span className="text-yellow-400 animate-pulse">pinging...</span>
        }
        const latestPing = r.pings[r.pings.length - 1]
        if (!latestPing) return <span className="font-mono text-zinc-600">--</span>
        const latestMs = latestPing.ms
        const latestColor = latestMs < 500 ? 'text-green-400' : latestMs < 1500 ? 'text-yellow-400' : 'text-red-400'
        return <span className={`font-mono text-sm ${latestColor}`}>{latestMs}ms</span>
      case 'avg':
        const avg = getAvg(r)
        if (avg === Infinity) return <span className="font-mono text-zinc-600">--</span>
        const avgColor = avg < 500 ? 'text-green-400' : avg < 1500 ? 'text-yellow-400' : 'text-red-400'
        return <span className={`font-mono text-sm ${avgColor}`}>{avg}ms</span>
      case 'status':
        return <StatusBadge status={r.status} />
      case 'verdict':
        return <VerdictBadge verdict={getVerdict(r)} />
      case 'stability':
        const stability = getStabilityScore(r)
        if (stability === -1) return <span className="font-mono text-zinc-600">--</span>
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: `${stability}%` }}
              />
            </div>
            <span className="font-mono text-xs text-zinc-400">{stability}</span>
          </div>
        )
      case 'uptime':
        const uptime = getUptime(r)
        return <span className="font-mono text-zinc-400 text-sm">{uptime}%</span>
       case 'used':
          return <span className="font-mono text-zinc-600 text-sm">{formatTokenTotal(r.totalTokens)}</span>
      case 'usage':
        if (r.usagePercent === undefined) return <span className="font-mono text-zinc-600 text-sm">--</span>
        return <span className="font-mono text-zinc-400 text-sm">{r.usagePercent}%</span>
      default:
        return null
    }
  }

  return (
    <div 
      ref={tableRef} 
      className="flex-1 overflow-auto bg-zinc-950"
    >
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-zinc-900 z-10 border-b border-zinc-800">
          <tr>
            {COLUMNS.map(col => (
              <th 
                key={col.key}
                className="px-3 py-2.5 font-semibold text-zinc-300 cursor-pointer hover:text-white transition-colors select-none border-b border-zinc-800"
                style={{ width: col.width * 5 }}
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  <span>{col.label}</span>
                  {col.shortKey && (
                    <span className="text-zinc-600 text-[10px] font-mono">[{col.shortKey}]</span>
                  )}
                  {sortColumn === col.key && (
                    <span className="text-zinc-300 ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleResults.map((r, idx) => (
            <tr
              key={`${r.providerKey}-${r.modelId}`}
              data-row-index={idx}
              className={`border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors cursor-pointer ${
                idx === cursor ? 'bg-zinc-800/60' : ''
              }`}
              onClick={() => setCursor(idx)}
            >
              {COLUMNS.map(col => (
                <td key={col.key} className="px-3 py-2.5 align-middle">
                  {renderCell(r, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {visibleResults.length === 0 && (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          No models match the current filters
        </div>
      )}
    </div>
  )
}