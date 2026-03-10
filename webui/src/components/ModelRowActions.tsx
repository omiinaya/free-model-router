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
  const { launchModel } = useApp()
  const [launching, setLaunching] = useState(false)

  const handleLaunch = async () => {
    setLaunching(true)
    try {
      await launchModel(providerKey, modelId)
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