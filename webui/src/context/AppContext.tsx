'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import type { ModelResult, SortColumn, SortDirection, PingMode, Config } from '@/types'
import { MODELS, sources } from '@/lib/sources'
import { sortResults } from '@/lib/utils'
import { PING_INTERVALS, TIER_CYCLE } from '@/constants'
import { startPingLoop, pingModel } from '@/lib/ping'
import { toast } from 'sonner'

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
  activeProfile: string | null
  lastPingTime: number
  config: Config
  settingsOpen: boolean
  helpOpen: boolean
  recommendOpen: boolean
  featureOpen: boolean
  bugOpen: boolean
  logOpen: boolean
  chatOpen: boolean
  searchQuery: string
  providerTestResults: Record<string, string>
  usageByModel: Record<string, number>
}

interface AppContextType extends AppState {
  setCursor: (cursor: number) => void
  setSort: (column: SortColumn, direction?: SortDirection) => void
  setPingMode: (mode: PingMode) => void
  cyclePingMode: () => void
  setTierFilter: (filter: number) => void
  cycleTierFilter: () => void
  setProviderFilter: (filter: number) => void
  cycleProviderFilter: () => void
  toggleHideUnconfigured: () => void
  toggleFavorite: (providerKey: string, modelId: string) => void
  setProviderTestResult: (providerKey: string, status: string) => void
  testProvider: (providerKey: string) => Promise<void>
  setSearchQuery: (query: string) => void
  setSettingsOpen: (open: boolean) => void
  setHelpOpen: (open: boolean) => void
  setRecommendOpen: (open: boolean) => void
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
  fcmProxyKey: '',
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
  activeProfile: null,
  lastPingTime: Date.now(),
  config: defaultConfig,
  settingsOpen: false,
  helpOpen: false,
  recommendOpen: false,
  featureOpen: false,
  bugOpen: false,
  logOpen: false,
  chatOpen: false,
  searchQuery: '',
  providerTestResults: {},
  usageByModel: {},
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const pingLoopRef = useRef<(() => void) | null>(null)
  // Ref for latest visibleResults to use in hotkey handler without re-subscribing
  const visibleResultsRef = useRef<ModelResult[]>([])
  const cursorRef = useRef<number>(0)

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
    // Filter hidden rows first (from other sources)
    let filtered = state.results.filter(r => !r.hidden)
    
    // Favorites are ALWAYS visible regardless of filters
    const favoritesOnly = filtered.filter(r => r.isFavorite)
    const nonFavorites = filtered.filter(r => !r.isFavorite)
    
    // Apply tier filter to non-favorites only
    const activeTier = TIER_CYCLE[state.tierFilter]
    if (activeTier) {
      nonFavorites.forEach(r => {
        r.hidden = r.tier !== activeTier
      })
    }
    
    // Apply provider filter to non-favorites only
    if (state.providerFilter > 0) {
      const providerKeys = Object.keys(sources)
      const selectedProvider = providerKeys[state.providerFilter - 1]
      if (selectedProvider) {
        nonFavorites.forEach(r => {
          r.hidden = r.hidden || r.providerKey !== selectedProvider
        })
      }
    }
    
    // Apply hideUnconfigured to non-favorites only
    if (state.hideUnconfigured) {
      nonFavorites.forEach(r => {
        const hasKey = !!state.config.apiKeys[r.providerKey]
        r.hidden = r.hidden || !hasKey
      })
    }
    
    // Combine: favorites first (preserve order), then filtered non-favorites
    let combined = [...favoritesOnly, ...nonFavorites.filter(r => !r.hidden)]
    
     // Apply search query (on both favorites and non-favorites)
     if (state.searchQuery.trim()) {
       const query = state.searchQuery.toLowerCase()
       combined = combined.filter(r => 
         r.label.toLowerCase().includes(query) ||
         r.providerKey.toLowerCase().includes(query) ||
         r.modelId.toLowerCase().includes(query)
       )
     }
     
     // Attach token usage totals from log
     combined = combined.map(r => ({
       ...r,
       totalTokens: state.usageByModel[`${r.providerKey}::${r.modelId}`] ?? 0
     }))
     
     // Then sort
     const sorted = sortResults(combined, state.sortColumn, state.sortDirection)
    
    setState(prev => ({
      ...prev,
      visibleResults: sorted,
      cursor: Math.min(prev.cursor, Math.max(0, sorted.length - 1)),
    }))
   }, [state.results, state.sortColumn, state.sortDirection, state.tierFilter, state.providerFilter, state.hideUnconfigured, state.config.apiKeys, state.searchQuery, state.usageByModel])

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

  const cyclePingMode = useCallback(() => {
    const modes: PingMode[] = ['speed', 'normal', 'slow', 'forced']
    setState(prev => {
      const currentIdx = modes.indexOf(prev.pingMode)
      const nextIdx = (currentIdx + 1) % modes.length
      const nextMode = modes[nextIdx]
      return {
        ...prev,
        pingMode: nextMode,
        pingInterval: PING_INTERVALS[nextMode],
      }
    })
  }, [])

  const setTierFilter = useCallback((filter: number) => {
    setState(prev => ({ ...prev, tierFilter: filter }))
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

  const setProviderTestResult = useCallback((providerKey: string, status: string) => {
    setState(prev => ({
      ...prev,
      providerTestResults: {
        ...prev.providerTestResults,
        [providerKey]: status,
      },
    }))
  }, [])

  const testProvider = useCallback(async (providerKey: string) => {
    const apiKeyRaw = state.config.apiKeys[providerKey]
    if (!apiKeyRaw) {
      setProviderTestResult(providerKey, 'fail')
      toast.error(`No API key for ${providerKey}`)
      return
    }
    // Support single key or array (multiple accounts) - use first key
    const apiKey = Array.isArray(apiKeyRaw) ? apiKeyRaw[0] : apiKeyRaw

    setProviderTestResult(providerKey, 'pending')

    // Get models for this provider
    const providerModels = sources[providerKey] as any
    if (!providerModels || !Array.isArray(providerModels) || providerModels.length === 0) {
      setProviderTestResult(providerKey, 'no_callable_model')
      return
    }

    // Try up to 3 models (first ones)
    const maxAttempts = Math.min(3, providerModels.length)
    const attemptedCodes: string[] = []

    for (let i = 0; i < maxAttempts; i++) {
      const model = providerModels[i]
      const modelId = model[0]
      try {
        const result = await pingModel(providerKey, modelId, apiKey)
        attemptedCodes.push(result.code)
        if (result.code === '200') {
          setProviderTestResult(providerKey, 'ok')
          toast.success(`${providerKey} connection OK`)
          return
        }
        if (result.code === '401' || result.code === '403') {
          setProviderTestResult(providerKey, 'fail')
          toast.error(`${providerKey} auth failed`)
          return
        }
      } catch (e) {
        attemptedCodes.push('500')
      }
    }

    // Determine outcome from attempted codes
    const all429 = attemptedCodes.every(code => code === '429')
    if (all429) {
      setProviderTestResult(providerKey, 'rate_limited')
      toast.warning(`${providerKey} rate limited`)
      return
    }

    setProviderTestResult(providerKey, 'no_callable_model')
    toast.error(`${providerKey}: no callable model`)
  }, [state.config.apiKeys])

  const setSettingsOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, settingsOpen: open })), [])
  const setHelpOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, helpOpen: open })), [])
  const setRecommendOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, recommendOpen: open })), [])
  const setFeatureOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, featureOpen: open })), [])
  const setBugOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, bugOpen: open })), [])
  const setLogOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, logOpen: open })), [])
  const setChatOpen = useCallback((open: boolean) => setState(prev => ({ ...prev, chatOpen: open })), [])

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }, [])

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/usage')
      if (res.ok) {
        const { usageByModel } = await res.json()
        setState(prev => ({ ...prev, usageByModel }))
      }
    } catch (e) {
      console.error('Failed to fetch usage:', e)
    }
  }, [])

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

    // Load token usage on mount
    useEffect(() => {
      fetchUsage()
    }, [fetchUsage])

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

  // Keep refs in sync for hotkey handler
  useEffect(() => {
    visibleResultsRef.current = state.visibleResults
  }, [state.visibleResults])

  useEffect(() => {
    cursorRef.current = state.cursor
  }, [state.cursor])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey) return

      // Ignore when typing in input/textarea/contenteditable
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (isInput) return

      const key = e.key.toLowerCase()

       switch (key) {
         case 't':
           cycleTierFilter()
           break
         case 'w':
           cyclePingMode()
           break
         case 'n':
           cycleProviderFilter()
           break
         case 'arrowup':
           e.preventDefault()
           const newUp = Math.max(0, cursorRef.current - 1)
           setCursor(newUp)
           break
         case 'arrowdown':
           e.preventDefault()
           const newDown = Math.min(visibleResultsRef.current.length - 1, cursorRef.current + 1)
           setCursor(newDown)
           break
         // No default action for Enter since launching is disabled
       }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
   }, [cycleTierFilter, cyclePingMode, cycleProviderFilter, setCursor])

  const value: AppContextType = {
    ...state,
    setCursor,
    setSort,
    setPingMode,
    cyclePingMode,
    setTierFilter,
    cycleTierFilter,
    setProviderFilter,
    cycleProviderFilter,
    toggleHideUnconfigured,
    toggleFavorite,
    setProviderTestResult,
    testProvider,
    setSearchQuery,
    setSettingsOpen,
    setHelpOpen,
    setRecommendOpen,
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