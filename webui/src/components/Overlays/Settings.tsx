'use client'

import { useApp } from '@/context/AppContext'
import { sources } from '@/lib/sources'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'

export function Settings() {
  const { settingsOpen, setSettingsOpen, config, saveConfig } = useApp()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editBuffer, setEditBuffer] = useState('')

  const providerKeys = Object.keys(sources)

  const handleToggleProvider = async (providerKey: string) => {
    const newEnabled = !config.providers[providerKey]?.enabled
    const newConfig = {
      ...config,
      providers: {
        ...config.providers,
        [providerKey]: { enabled: newEnabled },
      },
    }
    await saveConfig(newConfig)
  }

  const handleStartEdit = (providerKey: string) => {
    setEditingKey(providerKey)
    const currentKey = config.apiKeys[providerKey]
    setEditBuffer(typeof currentKey === 'string' ? currentKey : (Array.isArray(currentKey) ? currentKey[0] : ''))
  }

   const handleSaveKey = async (providerKey: string) => {
     const newApiKeys = { ...config.apiKeys }
     if (editBuffer.trim()) {
       newApiKeys[providerKey] = editBuffer.trim()
     } else {
       delete newApiKeys[providerKey]
     }
     const newConfig = { ...config, apiKeys: newApiKeys }
     await saveConfig(newConfig)
     setEditingKey(null)
     setEditBuffer('')
   }

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>⚙ Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">🧩 Providers</h3>
            <div className="space-y-2">
              {providerKeys.map(pk => {
                const src = sources[pk]
                const isEnabled = config.providers[pk]?.enabled !== false
                const apiKey = config.apiKeys[pk]
                
                return (
                  <div 
                    key={pk}
                    className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg"
                  >
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleToggleProvider(pk)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{src.label}</div>
                      <div className="text-xs text-zinc-400">{src.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingKey === pk ? (
                        <>
                          <Input
                            type="password"
                            value={editBuffer}
                            onChange={(e) => setEditBuffer(e.target.value)}
                            placeholder="Enter API key..."
                            className="w-48"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveKey(pk)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-zinc-400 font-mono">
                            {apiKey ? `••••${typeof apiKey === 'string' ? apiKey.slice(-4) : ''}` : '(no key)'}
                          </span>
                          <Button size="sm" variant="outline" onClick={() => handleStartEdit(pk)}>
                            {apiKey ? 'Edit' : 'Add'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-zinc-700 pt-4">
            <h3 className="text-lg font-semibold mb-3">🛠 Maintenance</h3>
            <div className="flex gap-3">
              <Button variant="outline">Check for Updates</Button>
              <Button variant="outline">Restore Backup</Button>
            </div>
          </div>

          <div className="border-t border-zinc-700 pt-4">
            <h3 className="text-lg font-semibold mb-3">🔀 Proxy</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch />
                <span>Enable proxy mode</span>
              </div>
              <div className="flex items-center gap-3">
                <Switch />
                <span>Persist proxy in OpenCode</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-400">Preferred port:</span>
                <Input type="number" className="w-24" placeholder="0 = auto" />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}