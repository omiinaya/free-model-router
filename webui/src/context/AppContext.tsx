'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import type { ModelResult, SortColumn, SortDirection, PingMode, ToolMode, Config } from '@/types'
import { MODELS } from '@/lib/sources'
import { sortResults, filterByTier } from '@/lib/utils'
import { PING_INTERVALS, TIER_CYCLE } from '@/constants'
import { startPingLoop, pingModel } from '@/lib/ping'

interface AppState {
  results: ModelResult[]
  visibleResults: ModelResult[]
  cursor: number
  sortColumn: SortColumn
  sortDirection: SortDirection
  pingMode: PingMode
  pingInterval: number
  tierFilter: number
  providerFilter: number
  hideUnconfigured: boolean
  toolMode: ToolMode
  activeProfile: string | null
  lastPingTime: number
  config: Config
  settingsOpen: boolean
  helpOpen: boolean
  recommendOpen: boolean
  installOpen: boolean
  featureOpen: boolean
  bugOpen: boolean
  logOpen: boolean
  chatOpen: boolean
}

interface AppContextType extends AppState {
  setCursor: (cursor: number) => void
  setSort: (column: SortColumn, direction?: SortDirection) => void
  setPingMode: (mode: PingMode) => void
  cycleTierFilter: () => void
  setProviderFilter: (filter: number) => void
  cycleProviderFilter: () => void
  toggleHideUnconfigured: () => void
  setToolMode: (mode: ToolMode) => void
  toggleFavorite: (providerKey: string, modelId: string) => void
  setSettingsOpen: (open: boolean) => void
  setHelpOpen: (open: boolean) => void
  setRecommendOpen: (open: boolean) => void
  setInstallOpen: (open: boolean) => void
   setFeatureOpen: (open: boolean) => void
   setBugOpen: (open: boolean) => void
   setLogOpen: (open: boolean) => void
   setChatOpen: (open: boolean) => void
   refreshResults: () => void
  setConfig: (config: Config) => void
  saveConfig: (newConfig: Config) => Promise<void>
}

const defaultConfig: Config = {
  apiKeys: {},
  providers: {},
  favorites: [],
  activeProfile: null,
  profiles: {},
}

const initialState: AppState = {
  results: [],
  visibleResults: [],
  cursor: 0,
  sortColumn: 'avg',
  sortDirection: 'asc',
  pingMode: 'speed',
  pingInterval: PING_INTERVALS.speed,
  tierFilter: 0,
  providerFilter: 0,
  hideUnconfigured: false,
  toolMode: 'opencode',
  activeProfile: null,
  lastPingTime: Date.now(),
  config: defaultConfig,
  settingsOpen: false,
  helpOpen: false,
  recommendOpen: false,
  installOpen: false,
  featureOpen: false,
  bugOpen: false,
  logOpen: false,
  chatOpen: false,
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const pingLoopRef = useRef<(() => void) | null>(null)

  const [state, setState] = useState<AppState>(() => {
    const results = MODELS.map(([modelId, label, tier, sweScore, ctx, providerKey], idx) => ({
      idx: idx + 1,
      modelId,
      label,
      tier,
      sweScore,
      ctx,
      providerKey,
      status: 'pending' as const,
      pings: [],
      httpCode: null,
      isPinging: false,
      hidden: false,
      isFavorite: false,
      isRecommended: false,
      recommendScore: 0,
    }))
    
    const visibleResults = sortResults(results, 'avg', 'asc')
    
    return {
      ...initialState,
      results,
      visibleResults,
    }
  })


  const applyFiltersAndSort = useCallback(() => {
    let filtered = state.results.filter(r => !r.hidden)
    
    const activeTier = TIER_CYCLE[state.tierFilter]
    if (activeTier) {
      filtered = filtered.filter(r => r.tier === activeTier)
    }
    
    filtered = sortResults(filtered, state.sortColumn, state.sortDirection)
    
    setState(prev => ({
      ...prev,
      visibleResults: filtered,
      cursor: Math.min(prev.cursor, Math.max(0, filtered.length - 1)),
    }))
  }, [state.results, state.sortColumn, state.sortDirection, state.tierFilter])

  useEffect(() => {
    applyFiltersAndSort()
  }, [applyFiltersAndSort])

  const setCursor = useCallback((cursor: number) => {
    setState(prev => ({ ...prev, cursor: Math.max(0, Math.min(cursor, prev.visibleResults.length - 1)) }))
  }, [])

  const setSort = useCallback((column: SortColumn, direction?: SortDirection) => {
    setState(prev => ({
      ...prev,
      sortColumn: column,
      sortDirection: direction || (prev.sortColumn === column && prev.sortDirection === 'asc' ? 'desc' : 'asc'),
    }))
  }, [])

  const setPingMode = useCallback((mode: PingMode) => {
    setState(prev => ({
      ...prev,
      pingMode: mode,
      pingInterval: PING_INTERVALS[mode],
    }))
  }, [])

  const cycleTierFilter = useCallback(() => {
    setState(prev => ({
      ...prev,
      tierFilter: (prev.tierFilter + 1) % TIER_CYCLE.length,
    }))
  }, [])

  const setProviderFilter = useCallback((filter: number) => {
    setState(prev => ({ ...prev, providerFilter: filter }))
  }, [])

  const cycleProviderFilter = useCallback(() => {
    setState(prev => ({
      ...prev,
      providerFilter: (prev.providerFilter + 1) % 21,
    }))
  }, [])

  const toggleHideUnconfigured = useCallback(() => {
    setState(prev => ({ ...prev, hideUnconfigured: !prev.hideUnconfigured }))
  }, [])

  const setToolMode = useCallback((mode: ToolMode) => {
    setState(prev => ({ ...prev, toolMode: mode }))
  }, [])

  const toggleFavorite = useCallback((providerKey: string, modelId: string) => {
    const key = `${providerKey}/${modelId}`
    setState(prev => {
      const newResults = prev.results.map(r => {
        if (`${r.providerKey}/${r.modelId}` === key) {
          return { ...r, isFavorite: !r.isFavorite }
        }
        return r
      })
      // Update favorites in config
      const isNowFavorite = !prev.results.find(r => `${r.providerKey}/${r.modelId}` === key)?.isFavorite
      const newFavorites = isNowFavorite
        ? [...prev.config.favorites, key]
        : prev.config.favorites.filter((f: string) => f !== key)
      const newConfig = { ...prev.config, favorites: newFavorites }
      // Note: we'll save config separately, but update state
      return { ...prev, results: newResults, config: newConfig }
    })
  }, [])

  const setSettingsOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, settingsOpen: open })), [])
  const setHelpOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, helpOpen: open })), [])
  const setRecommendOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, recommendOpen: open })), [])
  const setInstallOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, installOpen: open })), [])
  const setFeatureOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, featureOpen: open })), [])
  const setBugOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, bugOpen: open })), [])
  const setLogOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, logOpen: open })), [])
  const setChatOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, chatOpen: open })), [])

  const refreshResults = useCallback(() => {
    applyFiltersAndSort()
  }, [applyFiltersAndSort])

  const setConfig = useCallback((config: Config) => {
    setState(prev => ({ ...prev, config }))
  }, [])

  const saveConfig = useCallback(async (newConfig: Config) => {
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      })
      if (res.ok) {
        setConfig(newConfig)
      } else {
        console.error('Failed to save config')
      }
    } catch (error) {
      console.error('Error saving config:', error)
    }
  }, [setConfig])

   // Load config on mount
   useEffect(() => {
     const load = async () => {
       try {
         const res = await fetch('/api/config')
         if (res.ok) {
           const cfg = await res.json()
           setConfig(cfg)
         }
       } catch (e) {
         console.error('Failed to load config', e)
       }
     }
     load()
   }, [setConfig])

   // Auto-save config when it changes
   useEffect(() => {
     const save = async () => {
      try {
        await fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.config),
        })
      } catch (e) {
        console.error('Failed to auto-save config', e)
      }
    }
    save()
  }, [state.config])

   // Handle ping completion
  const handlePingComplete = useCallback((modelId: string, result: { ms: number; code: string; quotaPercent?: number }) => {
    setState(prev => ({
      ...prev,
      results: prev.results.map(r => {
        if (r.modelId !== modelId) return r
        const newPings = [...r.pings, { ms: result.ms, code: result.code }]
        if (newPings.length > 100) newPings.shift()
        let status: ModelResult['status'] = 'pending'
        if (result.code === '200') status = 'up'
        else if (result.code === '401') status = 'noauth'
        else if (result.code === '429') status = 'up'
        else if (result.code === '408') status = 'timeout'
        else status = 'down'
        return {
          ...r,
          pings: newPings,
          httpCode: result.code,
          status,
          usagePercent: result.quotaPercent,
        }
      }),
      lastPingTime: Date.now(),
    }))
  }, [])

  // Ping loop
  useEffect(() => {
    const cleanup = startPingLoop(
      state.results,
      handlePingComplete,
      state.pingMode,
      () => false,
      () => {
        setState(prev => ({ ...prev, lastPingTime: Date.now() }))
      }
    )
    pingLoopRef.current = cleanup

    return () => {
      if (pingLoopRef.current) {
        pingLoopRef.current()
        pingLoopRef.current = null
      }
    }
  }, [state.results, state.pingMode, handlePingComplete])

  const value: AppContextType = {
    ...state,
    setCursor,
    setSort,
    setPingMode,
    cycleTierFilter,
    setProviderFilter,
    cycleProviderFilter,
    toggleHideUnconfigured,
    setToolMode,
    toggleFavorite,
    setSettingsOpen,
    setHelpOpen,
    setRecommendOpen,
    setInstallOpen,
    setFeatureOpen,
    setBugOpen,
    setLogOpen,
    setChatOpen,
    refreshResults,
    setConfig,
    saveConfig,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}