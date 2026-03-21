'use client'

import { useApp } from '@/context/AppContext'
import { TIER_CYCLE, PING_INTERVAL_MS } from '@/constants'
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
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

function truncateKey(key: string | undefined, len = 8): string {
  if (!key) return 'Not set'
  if (key.length <= len) return key
  return key.slice(0, len) + '...'
}

function copyKey(key: string | undefined, setOpen: (b: boolean) => void) {
  if (key) {
    navigator.clipboard.writeText(key)
    toast.success('API key copied to clipboard')
  } else {
    setOpen(true)
  }
}

export function Header() {
  const {
    refreshSpeed,
    setRefreshSpeed,
    tierFilter,
    setTierFilter,
    activeProfile,
    visibleResults,
    lastPingTime,
    settingsOpen,
    setSettingsOpen,
    helpOpen,
    setHelpOpen,
  apiDocsOpen,
  setApiDocsOpen,
  recommendOpen,
    setRecommendOpen,
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
    config,
  } = useApp()

  const [secondsUntilNext, setSecondsUntilNext] = useState<string>('--')

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now()
      const timeSinceLastPing = now - lastPingTime
      const remaining = Math.max(0, (PING_INTERVAL_MS - timeSinceLastPing) / 1000)
      const formatted = remaining.toFixed(1)
      const padded = formatted.padStart(4, '0')
      setSecondsUntilNext(padded)
    }

    updateCountdown()

    const timer = setInterval(updateCountdown, 1000)

    return () => clearInterval(timer)
  }, [lastPingTime])

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

          {/* API Key Indicator */}
          <button
            onClick={() => copyKey(config.fcmProxyKey, setSettingsOpen)}
            className="flex items-center gap-2 text-xs hover:bg-zinc-800 px-2 py-1 rounded transition-colors"
            title={config.fcmProxyKey ? 'Click to copy API key' : 'Click to set in Settings'}
          >
            <span className="text-zinc-400">API:</span>
            <code className="font-mono text-zinc-300">{truncateKey(config.fcmProxyKey)}</code>
          </button>

          {/* Tier Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 h-8 px-3">
              <span className="flex items-center gap-2">
                <span>Tier</span>
                <span className="text-zinc-400">
                  {tierFilter === 0 ? 'All' : TIER_CYCLE[tierFilter]}
                </span>
              </span>
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
          {/* Speed Dropdown - UI Refresh Rate */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 h-8 px-3">
              <span className="flex items-center gap-2">
                ⚡
                <span>{refreshSpeed <= 200 ? 'Fast' : refreshSpeed <= 500 ? 'Normal' : 'Slow'}</span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setRefreshSpeed(100)} className={refreshSpeed === 100 ? 'bg-zinc-800' : ''}>
                ⚡ Fast (100ms)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRefreshSpeed(300)} className={refreshSpeed === 300 ? 'bg-zinc-800' : ''}>
                🚀 Normal (300ms)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRefreshSpeed(500)} className={refreshSpeed === 500 ? 'bg-zinc-800' : ''}>
                🐢 Slow (500ms)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRefreshSpeed(1000)} className={refreshSpeed === 1000 ? 'bg-zinc-800' : ''}>
                💤 Very Slow (1000ms)
              </DropdownMenuItem>
</DropdownMenuContent>
        </DropdownMenu>

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

  {/* API Docs Button */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setApiDocsOpen(true)}
    className="h-8"
  >
    📖 API
  </Button>
</div>
      </div>
    </div>
  )
}