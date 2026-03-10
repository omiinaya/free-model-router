'use client'

import { useApp } from '@/context/AppContext'
import { Switch } from '@/components/ui/switch'

export function ConfiguredToggle() {
  const { hideUnconfigured, toggleHideUnconfigured } = useApp()

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={hideUnconfigured}
        onCheckedChange={toggleHideUnconfigured}
        id="hide-unconfigured"
      />
      <label htmlFor="hide-unconfigured" className="text-sm cursor-pointer">
        Configured only
      </label>
    </div>
  )
}