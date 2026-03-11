'use client'

import { useApp } from '@/context/AppContext'
import { TOOL_METADATA, TOOL_MODE_ORDER, TIER_CYCLE } from '@/constants'
import type { ToolMode, PingMode } from '@/types'
import { ProviderFilter } from '@/components/Filters/ProviderFilter'
import { ConfiguredToggle } from '@/components/Filters/ConfiguredToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, SignalHigh, SignalMedium, SignalLow, Signal } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Header() {
  const {
    pingMode,
    setPingMode,
    toolMode,
    setToolMode,
    tierFilter,
    setTierFilter,
    activeProfile,
    visibleResults,
    lastPingTime,
    pingInterval,
    settingsOpen,
    setSettingsOpen,
    helpOpen,
    setHelpOpen,
    recommendOpen,
    setRecommendOpen,
    installOpen,
    setInstallOpen,
    featureOpen,
    setFeatureOpen,
    bugOpen,
    setBugOpen,
    logOpen,
    setLogOpen,
    chatOpen,
    setChatOpen,
    searchQuery,
    setSearchQuery,
    launchBest,
  } = useApp()

  const [secondsUntilNext, setSecondsUntilNext] = useState<string>('--')

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now()
      const timeSinceLastPing = now - lastPingTime
      const remaining = Math.max(0, (pingInterval - timeSinceLastPing) / 1000)
      const formatted = remaining.toFixed(1)
      // Pad to 4 characters (e.g., "09.9" instead of "9.9") to prevent layout shifts
      const padded = formatted.padStart(4, '0')
      setSecondsUntilNext(padded)
    }

    // Update immediately
    updateCountdown()

    // Then update every second
    const timer = setInterval(updateCountdown, 1000)

    return () => clearInterval(timer)
  }, [lastPingTime, pingInterval])

  const tools: ToolMode[] = [...TOOL_MODE_ORDER]

  return (
    <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-white">
            Free Coding Models
          </h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 w-[200px] bg-zinc-800 border-zinc-700"
            />
          </div>

          {/* Tool Mode Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 h-8 px-3">
              <span className="text-yellow-400">Z</span>
              <span className="ml-2">Tool: {TOOL_METADATA[toolMode]?.label}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {tools.map(tool => (
                <DropdownMenuItem
                  key={tool}
                  onClick={() => setToolMode(tool)}
                  className={tool === toolMode ? 'bg-zinc-800' : ''}
                >
                  {TOOL_METADATA[tool]?.emoji} {TOOL_METADATA[tool]?.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tier Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button size="sm" variant="outline" className="h-8">
                <span className="flex items-center gap-2">
                  <span>Tier</span>
                  <span className="text-zinc-400">
                    {tierFilter === 0 ? 'All' : TIER_CYCLE[tierFilter]}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => setTierFilter(0)}
                className={tierFilter === 0 ? 'bg-zinc-800' : ''}
              >
                All
              </DropdownMenuItem>
              {TIER_CYCLE.slice(1).map((tier, idx) => {
                const filterIndex = idx + 1
                return (
                  <DropdownMenuItem
                    key={tier}
                    onClick={() => setTierFilter(filterIndex)}
                    className={tierFilter === filterIndex ? 'bg-zinc-800' : ''}
                  >
                    {tier}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Provider Filter */}
          <ProviderFilter />

          {/* Hide Unconfigured Toggle */}
          <ConfiguredToggle />

          {/* Active Profile */}
          {activeProfile && (
            <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-purple-500/20 text-purple-400 rounded-md">
              📋 {activeProfile}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Ping Mode Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button size="sm" variant="outline" className="h-8">
                <span className="flex items-center gap-2">
                  {(() => {
                    const pingModeInfo: Record<PingMode, { Icon: any; color: string; label: string }> = {
                      speed: { Icon: Signal, color: 'text-green-400', label: 'Speed' },
                      normal: { Icon: SignalHigh, color: 'text-zinc-300', label: 'Normal' },
                      slow: { Icon: SignalMedium, color: 'text-yellow-400', label: 'Slow' },
                      forced: { Icon: SignalLow, color: 'text-red-400', label: 'Forced' }
                    }
                    const { Icon, color, label } = pingModeInfo[pingMode]
                    return (
                      <>
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span>{label}</span>
                      </>
                    )
                  })()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(['speed', 'normal', 'slow', 'forced'] as Array<PingMode>).map(mode => {
                const pingModeInfo: Record<PingMode, { Icon: any; color: string; label: string }> = {
                  speed: { Icon: Signal, color: 'text-green-400', label: 'Speed' },
                  normal: { Icon: SignalHigh, color: 'text-zinc-300', label: 'Normal' },
                  slow: { Icon: SignalMedium, color: 'text-yellow-400', label: 'Slow' },
                  forced: { Icon: SignalLow, color: 'text-red-400', label: 'Forced' }
                }
                const { Icon, color, label } = pingModeInfo[mode]
                return (
                  <DropdownMenuItem
                    key={mode}
                    onClick={() => setPingMode(mode)}
                    className={pingMode === mode ? 'bg-zinc-800' : ''}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span>{label}</span>
                    </span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Launch Best Button */}
          <Button
            size="sm"
            variant="default"
            onClick={launchBest}
            className="h-8 bg-green-600 hover:bg-green-700 text-white"
          >
            🚀 Launch Best
          </Button>

          {/* Ping Status */}
          <div className="text-sm text-zinc-400 flex items-center gap-2">
            <span>
              {visibleResults.filter(r => r.status !== 'pending').length}/{visibleResults.length}
            </span>
            <span>next: {secondsUntilNext}s</span>
          </div>

          {/* Chat Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChatOpen(true)}
            className="h-8"
          >
            💬 Chat
          </Button>

          {/* Settings Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="h-8"
          >
            ⚙ Settings
          </Button>

          {/* Help Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHelpOpen(!helpOpen)}
            className="h-8"
          >
            ❓ Help
          </Button>
        </div>
      </div>
    </div>
  )
}