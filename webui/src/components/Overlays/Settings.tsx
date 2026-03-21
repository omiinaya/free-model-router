'use client'

import { useApp } from '@/context/AppContext'
import { sources } from '@/lib/sources'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useState } from 'react'

export function Settings() {
  const { settingsOpen, setSettingsOpen, config, saveConfig, providerTestResults, testProvider } = useApp() as any
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editBuffer, setEditBuffer] = useState('')
  const [proxyKeyInput, setProxyKeyInput] = useState(config.fcmProxyKey || '')
  const [newProfileName, setNewProfileName] = useState('')

  const providerKeys = Object.keys(sources)

  const profileNames = Object.keys(config.profiles || {})
  const activeProfile = config.activeProfile

  const getStatusIcon = (pk: string) => {
    const status = providerTestResults[pk]
    if (!status || status === '') return null
    switch (status) {
      case 'pending': return <span className="text-yellow-400">⏳ Testing...</span>
      case 'ok': return <span className="text-green-400">✅ OK</span>
      case 'fail': return <span className="text-red-400">❌ Fail</span>
      case 'rate_limited': return <span className="text-yellow-400">⏰ Rate limit</span>
      case 'no_callable_model': return <span className="text-orange-400">⚠️ No model</span>
      default: return null
    }
  }

  // Profile management
  const handleSaveProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Enter a profile name')
      return
    }
    const snapshot = {
      apiKeys: config.apiKeys,
      providers: config.providers,
      favorites: config.favorites,
      settings: config.settings || {},
    }
    const newProfiles = { ...config.profiles, [newProfileName.trim()]: snapshot }
    const newConfig = { ...config, profiles: newProfiles, activeProfile: newProfileName.trim() }
    await saveConfig(newConfig)
    setNewProfileName('')
    toast.success(`Profile "${newProfileName}" saved`)
  }

  const handleLoadProfile = async (name: string) => {
    const profile = config.profiles[name]
    if (!profile) return
    const newConfig = { ...config, ...profile, activeProfile: name }
    await saveConfig(newConfig)
    toast.success(`Loaded profile "${name}"`)
  }

  const handleDeleteProfile = async (name: string) => {
    if (!confirm(`Delete profile "${name}"?`)) return
    const newProfiles = { ...config.profiles }
    delete newProfiles[name]
    const newConfig = { ...config, profiles: newProfiles, activeProfile: config.activeProfile === name ? null : config.activeProfile }
    await saveConfig(newConfig)
    toast.success(`Deleted profile "${name}"`)
  }

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
                 const testStatus = providerTestResults[pk] || ''
                 
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
                       {apiKey && (
                         <>
                           <Button 
                             size="sm" 
                             variant="outline" 
                             onClick={() => testProvider(pk)}
                             disabled={testStatus === 'pending'}
                           >
                             {testStatus === 'pending' ? '⏳' : '🔍'} Test
                           </Button>
                           {getStatusIcon(pk)}
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

            <div className="border-t border-zinc-700 pt-4">
              <h3 className="text-lg font-semibold mb-3">🚦 Rate Limiting</h3>
              <p className="text-sm text-zinc-400 mb-3">
                Disable rate limiting by default. Enable and configure to protect your API.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch id="rate-limit-enable" />
                  <span>Enable rate limiting</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Requests per minute:</span>
                  <Input type="number" className="w-24" placeholder="60" defaultValue={60} />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-700 pt-4">
              <h3 className="text-lg font-semibold mb-3">🔑 FCM Proxy API Key</h3>
              <p className="text-sm text-zinc-400 mb-2">
                Set a single API key for external tools to access /api/completions. They will use this key to authenticate with FCM as a unified provider endpoint.
              </p>
<div className="flex items-center gap-3">
  <Input
    type="password"
    value={proxyKeyInput}
    onChange={(e) => setProxyKeyInput(e.target.value)}
    placeholder="Enter FCM proxy API key..."
    className="flex-1"
  />
  <Button
    size="sm"
    variant="outline"
    onClick={() => {
      const key = 'fcm_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      setProxyKeyInput(key)
      toast.info('Generated new key - click Save to apply')
    }}
  >
    Generate
  </Button>
  <Button
    size="sm"
    onClick={async () => {
      const newConfig = { ...config, fcmProxyKey: proxyKeyInput }
      await saveConfig(newConfig)
      toast.success('FCM proxy key saved')
    }}
  >
    Save
  </Button>
</div>
            </div>

            {/* Profiles */}
            <div className="border-t border-zinc-700 pt-4">
              <h3 className="text-lg font-semibold mb-3">👤 Profiles</h3>
              {activeProfile && (
                <div className="mb-2 text-sm">
                  <span className="text-zinc-400">Active:</span> <span className="text-yellow-400">{activeProfile}</span>
                </div>
              )}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Profile name..."
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-48"
                />
                <Button size="sm" onClick={handleSaveProfile}>Save as Profile</Button>
              </div>
              {profileNames.length > 0 && (
                <div className="space-y-2">
                  {profileNames.map(name => (
                    <div key={name} className="flex items-center gap-2 p-2 bg-zinc-800 rounded">
                      <span className="flex-1 font-mono text-sm">{name}</span>
                      <Button size="sm" variant="outline" onClick={() => handleLoadProfile(name)}>Load</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteProfile(name)}>Delete</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </DialogContent>
    </Dialog>
  )
}