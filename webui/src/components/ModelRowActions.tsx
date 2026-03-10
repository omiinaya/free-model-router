'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ModelRowActionsProps {
  modelId: string
  providerKey: string
  label: string
}

export function ModelRowActions({ modelId, providerKey, label }: ModelRowActionsProps) {
  const { config } = useApp()
  const [launching, setLaunching] = useState(false)

  const handleLaunch = async () => {
    setLaunching(true)
    try {
      // Determine which API key to use
      const apiKey = config.apiKeys[providerKey]
      if (!apiKey) {
        toast.error(`No API key configured for ${providerKey}`)
        setLaunching(false)
        return
      }

      // For now, just show a toast - we'll implement the actual launch later
      toast.success(`Launching ${label} via ${providerKey}...`)
      // TODO: OpenCode/Desktop integration
    } catch (error) {
      toast.error('Launch failed')
    } finally {
      setLaunching(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleLaunch}
      disabled={launching}
      className="h-7 text-xs"
    >
      {launching ? '⏳' : '🚀'}
    </Button>
  )
}