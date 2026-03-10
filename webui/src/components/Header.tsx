'use client'

import { useApp } from '@/context/AppContext'
import { TOOL_METADATA, PING_INTERVALS, TOOL_MODE_ORDER } from '@/constants'
import type { ToolMode, PingMode } from '@/types'
import { TierFilter } from '@/components/Filters/TierFilter'
import { ProviderFilter } from '@/components/Filters/ProviderFilter'
import { ConfiguredToggle } from '@/components/Filters/ConfiguredToggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const {
    pingMode,
    setPingMode,
    toolMode,
    setToolMode,
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
  } = useApp()

  const tools: ToolMode[] = [...TOOL_MODE_ORDER]
  const currentToolIdx = tools.indexOf(toolMode)

  const cycleTool = () => {
    const nextIdx = (currentToolIdx + 1) % tools.length
    setToolMode(tools[nextIdx])
  }

  const cyclePingMode = () => {
    const modes: PingMode[] = ['speed', 'normal', 'slow', 'forced']
    const currentIdx = modes.indexOf(pingMode)
    const nextIdx = (currentIdx + 1) % modes.length
    setPingMode(modes[nextIdx])
  }

  const timeSinceLastPing = Date.now() - lastPingTime
  const secondsUntilNext = Math.max(0, (pingInterval - timeSinceLastPing) / 1000).toFixed(1)
  const totalVisible = visibleResults.length
  const pending = visibleResults.filter(r => r.status === 'pending').length
  const completedPings = totalVisible - pending

  const pingModeLabels = {
    speed: { label: 'Speed', color: 'bg-orange-500' },
    normal: { label: 'Normal', color: 'bg-blue-500' },
    slow: { label: 'Slow', color: 'bg-purple-500' },
    forced: { label: 'Forced', color: 'bg-red-500' },
  }

  return (
    <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-white">
            Free Coding Models
          </h1>

          {/* Tool Mode Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <span className="text-yellow-400">Z</span>
                <span>Tool: {TOOL_METADATA[toolMode]?.label}</span>
              </Button>
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

          {/* Tier Filter */}
          <TierFilter />

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
          {/* Ping Mode Buttons */}
          <div className="flex items-center gap-1">
            {(Object.keys(pingModeLabels) as Array<keyof typeof pingModeLabels>).map(mode => {
              const meta = pingModeLabels[mode]
              const isActive = pingMode === mode
              return (
                <Button
                  key={mode}
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  className={`h-8 capitalize ${isActive ? meta.color + ' text-white' : ''}`}
                  onClick={() => setPingMode(mode)}
                >
                  {meta.label}
                </Button>
              )
            })}
          </div>

          {/* Ping Status */}
          <div className="text-sm text-zinc-400 flex items-center gap-2">
            <span>
              {completedPings}/{totalVisible}
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