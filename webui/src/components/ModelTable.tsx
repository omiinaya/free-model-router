'use client'

import { useApp } from '@/context/AppContext'
import { TierBadge } from '@/components/Badges/TierBadge'
import { StatusBadge } from '@/components/Badges/StatusBadge'
import { ProviderBadge } from '@/components/Badges/ProviderBadge'
import { VerdictBadge } from '@/components/Badges/VerdictBadge'
import { ModelRowActions } from '@/components/ModelRowActions'
import { getAvg, getUptime, getStabilityScore, getVerdict } from '@/lib/utils'
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
    setSettingsOpen,
    setHelpOpen,
    setRecommendOpen,
    setInstallOpen,
    setFeatureOpen,
    setBugOpen,
    setLogOpen,
    cycleTierFilter,
    toggleHideUnconfigured,
  } = useApp()

  const tableRef = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 10)
    }, 1000 / 12)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setCursor(Math.max(0, cursor - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setCursor(Math.min(visibleResults.length - 1, cursor + 1))
          break
        case 'Enter':
          e.preventDefault()
          if (visibleResults[cursor]) {
            console.log('Selected:', visibleResults[cursor])
          }
          break
        case 'r':
        case 'R':
          setSort('rank')
          break
        case 't':
        case 'T':
          cycleTierFilter()
          break
        case 'o':
        case 'O':
          break
        case 'm':
        case 'M':
          setSort('model')
          break
        case 'l':
        case 'L':
          setSort('ping')
          break
        case 'a':
        case 'A':
          setSort('avg')
          break
        case 's':
        case 'S':
          setSort('swe')
          break
        case 'c':
        case 'C':
          setSort('ctx')
          break
        case 'h':
        case 'H':
          setSort('status')
          break
        case 'v':
        case 'V':
          setSort('verdict')
          break
        case 'b':
        case 'B':
          setSort('stability')
          break
        case 'u':
        case 'U':
          setSort('uptime')
          break
        case 'g':
        case 'G':
          setSort('usage')
          break
        case 'f':
        case 'F':
          if (visibleResults[cursor]) {
            const r = visibleResults[cursor]
            toggleFavorite(r.providerKey, r.modelId)
          }
          break
        case 'e':
        case 'E':
          toggleHideUnconfigured()
          break
        case 'p':
        case 'P':
          if (!e.shiftKey) setSettingsOpen(true)
          break
        case 'k':
        case 'K':
        case 'Escape':
          setHelpOpen(false)
          break
        case 'q':
        case 'Q':
          setRecommendOpen(true)
          break
        case 'y':
        case 'Y':
          setInstallOpen(true)
          break
        case 'j':
        case 'J':
          setFeatureOpen(true)
          break
        case 'i':
        case 'I':
          setBugOpen(true)
          break
        case 'x':
        case 'X':
          setLogOpen(true)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cursor, visibleResults, setCursor, setSort, cycleTierFilter, toggleHideUnconfigured, toggleFavorite, setSettingsOpen, setHelpOpen, setRecommendOpen, setInstallOpen, setFeatureOpen, setBugOpen, setLogOpen])

  const handleSort = (column: string) => {
    setSort(column as any)
  }

  const renderCell = (r: typeof visibleResults[0], col: typeof COLUMNS[number]) => {
    switch (col.key) {
      case 'rank':
        return <span className="text-zinc-400">#{r.idx}</span>
      case 'tier':
        return <TierBadge tier={r.tier} />
      case 'swe':
        return <span className="text-zinc-300">{r.sweScore}</span>
      case 'ctx':
        return <span className="text-zinc-400">{r.ctx}</span>
      case 'model':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(r.providerKey, r.modelId)
              }}
              className="text-lg focus:outline-none"
            >
              {r.isFavorite ? '⭐' : '☆'}
            </button>
            <span className="text-white font-medium">{r.label}</span>
          </div>
        )
      case 'provider':
        return <ProviderBadge providerKey={r.providerKey} />
      case 'latest':
        if (r.isPinging) {
          return <span className="text-yellow-400 animate-pulse">pinging...</span>
        }
        const latestPing = r.pings[r.pings.length - 1]
        if (!latestPing) return <span className="text-zinc-500">—</span>
        const latestMs = latestPing.ms
        const latestColor = latestMs < 500 ? 'text-green-400' : latestMs < 1500 ? 'text-yellow-400' : 'text-red-400'
        return <span className={latestColor}>{latestMs}ms</span>
      case 'avg':
        const avg = getAvg(r)
        if (avg === Infinity) return <span className="text-zinc-500">—</span>
        const avgColor = avg < 500 ? 'text-green-400' : avg < 1500 ? 'text-yellow-400' : 'text-red-400'
        return <span className={avgColor}>{avg}ms</span>
      case 'status':
        return <StatusBadge status={r.status} />
      case 'verdict':
        return <VerdictBadge verdict={getVerdict(r)} />
      case 'stability':
        const stability = getStabilityScore(r)
        if (stability === -1) return <span className="text-zinc-500">—</span>
        return (
          <div className="flex items-center gap-2">
            <div className="w-12 h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-green-500"
                style={{ width: `${stability}%` }}
              />
            </div>
            <span className="text-zinc-400 text-xs">{stability}</span>
          </div>
        )
      case 'uptime':
        const uptime = getUptime(r)
        return <span className="text-zinc-400">{uptime}%</span>
      case 'used':
        return <span className="text-zinc-500">--</span>
      case 'usage':
        if (r.usagePercent === undefined) return <span className="text-zinc-500">--</span>
        return <span className="text-zinc-400">{r.usagePercent}%</span>
      case 'launch':
        return (
          <ModelRowActions
            modelId={r.modelId}
            providerKey={r.providerKey}
            label={r.label}
          />
        )
      default:
        return null
    }
  }

  return (
    <div ref={tableRef} className="flex-1 overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-zinc-900 z-10">
          <tr className="text-left text-zinc-400 border-b border-zinc-800">
            {COLUMNS.map(col => (
              <th 
                key={col.key}
                className={`px-3 py-2 font-medium cursor-pointer hover:text-white transition-colors ${
                  sortColumn === col.key ? 'text-white' : ''
                }`}
                style={{ width: col.width * 4 }}
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  <span>{col.label}</span>
                  {col.shortKey && (
                    <span className="text-zinc-600 text-xs">[{col.shortKey}]</span>
                  )}
                  {sortColumn === col.key && (
                    <span className="text-zinc-300">{sortDirection === 'asc' ? '↑' : '↓'}</span>
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
              className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer ${
                idx === cursor ? 'bg-zinc-800/50' : ''
              }`}
              onClick={() => setCursor(idx)}
            >
              {COLUMNS.map(col => (
                <td key={col.key} className="px-3 py-2">
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