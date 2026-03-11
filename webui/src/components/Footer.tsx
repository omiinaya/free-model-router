'use client'

import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'

export function Footer() {
  const {
    toolMode,
    setSettingsOpen,
    setHelpOpen,
    setRecommendOpen,
    setInstallOpen,
    setFeatureOpen,
    setBugOpen,
    setLogOpen,
    setChatOpen,
    visibleResults,
    results,
    config,
  } = useApp()

  // Compute model counts
  const totalEligible = results.filter(r => 
    !r.hidden && config.apiKeys[r.providerKey]
  ).length
  const visible = visibleResults.length

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-zinc-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setChatOpen(true)}>
            💬 Chat
          </Button>
          <span className="flex items-center gap-1">
            <span className="text-zinc-300 font-mono">
              {visible} / {totalEligible}
            </span>
            <span>models</span>
          </span>
          <span className="mx-2">•</span>
          <span>
            <span className="text-zinc-400">↑↓</span> Navigate
          <span className="mx-2">•</span>
            <span className="text-zinc-400">Enter</span> Select
          <span className="mx-2">•</span>
            <span className="text-yellow-500">W</span> Ping Mode
            <span className="mx-2">•</span>
            <span className="text-yellow-500">T</span> Tier Filter
            <span className="mx-2">•</span>
            <span className="text-yellow-500">F</span> Favorite
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            <span className="text-yellow-500">E</span> Configured Only
            <span className="mx-2">•</span>
            <span className="text-yellow-500">P</span> Settings
            <span className="mx-2">•</span>
            <span className="text-yellow-500">K</span> Help
            <span className="mx-2">•</span>
            <span className="text-yellow-500">Q</span> Recommend
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setInstallOpen(true)}>
            📦 Install
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setFeatureOpen(true)}>
            ✨ Feature
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setBugOpen(true)}>
            🐛 Bug
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setLogOpen(true)}>
            📋 Logs
          </Button>
        </div>
        <div className="text-zinc-600">
          free-coding-models v0.2.1
        </div>
      </div>
    </div>
  )
}