'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { sources } from '@/lib/sources'
import { toast } from 'sonner'

const TOOLS = [
  { key: 'opencode', label: 'OpenCode CLI' },
  { key: 'opencode-desktop', label: 'OpenCode Desktop' },
  { key: 'openclaw', label: 'OpenClaw' },
  { key: 'crush', label: 'Crush' },
  { key: 'goose', label: 'Goose' },
]

export function InstallEndpoints() {
  const { installOpen, setInstallOpen, config } = useApp() as any
  const [provider, setProvider] = useState<string>('')
  const [tool, setTool] = useState<string>('')
  const [installing, setInstalling] = useState(false)

  const configuredProviders = Object.keys(sources).filter(pk => config.apiKeys[pk])

  const handleInstall = async () => {
    setInstalling(true)
    try {
      const res = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerKey: provider, toolMode: tool }),
      })
      if (res.ok) {
        toast.success('Installed successfully!')
        setInstallOpen(false)
      } else {
        toast.error('Installation failed')
      }
    } catch (e) {
      toast.error('Installation failed')
    } finally {
      setInstalling(false)
    }
  }

  return (
    <Dialog open={installOpen} onOpenChange={setInstallOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>📦 Install Provider Endpoints</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Provider</label>
            <select className="w-full p-2 rounded bg-zinc-800" value={provider} onChange={e => setProvider(e.target.value)}>
              <option value="">Select a configured provider</option>
              {configuredProviders.map(pk => (
                <option key={pk} value={pk}>{sources[pk].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Target Tool</label>
            <select className="w-full p-2 rounded bg-zinc-800" value={tool} onChange={e => setTool(e.target.value)}>
              <option value="">Select a tool</option>
              {TOOLS.map(t => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallOpen(false)}>Cancel</Button>
            <Button onClick={handleInstall} disabled={installing || !provider || !tool}>
              {installing ? 'Installing...' : 'Install'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}