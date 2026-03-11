'use client'

import { useApp } from '@/context/AppContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

export function Help() {
  const { 
    helpOpen, 
    setHelpOpen, 
    setSettingsOpen, 
    setRecommendOpen, 
    setLogOpen 
  } = useApp()

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>❓ Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🚀 Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => { setSettingsOpen(true); setHelpOpen(false) }}>
                  ⚙ Settings
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setRecommendOpen(true); setHelpOpen(false) }}>
                  🔍 Recommend
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setLogOpen(true); setHelpOpen(false) }}>
                  📋 Logs
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Navigation</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-yellow-400 font-mono">↑↓</span> Navigate rows</div>
                <div><span className="text-yellow-400 font-mono">Enter</span> Select model</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Controls</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-yellow-400 font-mono">W</span> Toggle ping mode</div>
                <div><span className="text-yellow-400 font-mono">E</span> Toggle configured only</div>
                <div><span className="text-yellow-400 font-mono">X</span> Toggle log page</div>
                <div><span className="text-yellow-400 font-mono">Z</span> Cycle tool mode</div>
                <div><span className="text-yellow-400 font-mono">F</span> Toggle favorite</div>
                <div><span className="text-yellow-400 font-mono">Y</span> Install endpoints</div>
                <div><span className="text-yellow-400 font-mono">Q</span> Smart Recommend</div>
                <div><span className="text-green-400 font-mono">J</span> Request Feature</div>
                <div><span className="text-orange-400 font-mono">I</span> Report Bug</div>
                <div><span className="text-yellow-400 font-mono">P</span> Open settings</div>
                <div><span className="text-yellow-400 font-mono">Shift+P</span> Cycle profile</div>
                <div><span className="text-yellow-400 font-mono">K</span> / <span className="text-yellow-400 font-mono">Esc</span> Help</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Columns Reference</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-mono text-zinc-300">Rank</span> — SWE-bench rank (1 = best coding score)</div>
                <div><span className="font-mono text-zinc-300">Tier</span> — Quality tier (S+, S, A+, A, A-, B+, B, C)</div>
                <div><span className="font-mono text-zinc-300">SWE%</span> — SWE-bench Verified score percentage</div>
                <div><span className="font-mono text-zinc-300">CTX</span> — Context window size (128k, 256k, 1M, etc.)</div>
                <div><span className="font-mono text-zinc-300">Model</span> — Model name (⭐ = favorite)</div>
                <div><span className="font-mono text-zinc-300">Provider</span> — API provider source</div>
                <div><span className="font-mono text-zinc-300">Latest</span> — Most recent ping response time (ms)</div>
                <div><span className="font-mono text-zinc-300">Avg Ping</span> — Average latency across all pings</div>
                <div><span className="font-mono text-zinc-300">Health</span> — Live status: ✅ UP / 🔥 429 / ⏳ TIMEOUT / ❌ ERR / 🔑 NO KEY</div>
                <div><span className="font-mono text-zinc-300">Verdict</span> — Overall assessment (Perfect, Normal, Spiky, Slow, Overloaded, Unstable, Not Active)</div>
                <div><span className="font-mono text-zinc-300">Stability</span> — Composite 0-100 score (lower p95 + jitter + spike rate + uptime = higher score)</div>
                <div><span className="font-mono text-zinc-300">Up%</span> — Uptime percentage (successful pings / total pings)</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Status Legend</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>✅ <span className="text-green-400">UP</span> — Working normally</div>
                <div>🔥 <span className="text-orange-400">429</span> — Rate limited</div>
                <div>⏳ <span className="text-yellow-400">TIMEOUT</span> — No response</div>
                <div>❌ <span className="text-red-400">ERR</span> — HTTP error</div>
                <div>🔑 <span className="text-purple-400">NO KEY</span> — API key not configured</div>
                <div>⏳ <span className="text-blue-400">Pending</span> — Not yet pinged</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">❓ FAQ</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold">How do I add API keys?</span>
                  <p className="text-zinc-400 mt-1">Open <span className="text-yellow-400">Settings</span> (P) and add your provider keys. They're stored securely in ~/.free-coding-models.json.</p>
                </div>
                <div>
                  <span className="font-semibold">How does "Launch Best" work?</span>
                  <p className="text-zinc-400 mt-1">It selects the top-ranked model according to current filters, favorites, and health status. You can customize selection with tier/provider filters.</p>
                </div>
                <div>
                  <span className="font-semibold">What do the verdicts mean?</span>
                  <p className="text-zinc-400 mt-1">Perfect (&lt;400ms), Normal (400-999ms), Slow (1-2.9s), Very Slow (3-4.9s), Overloaded (429), Unstable (spiky), Not Active (timeout).</p>
                </div>
                <div>
                  <span className="font-semibold">How does round-robin work?</span>
                  <p className="text-zinc-400 mt-1">When using <code>X-Mode: round-robin</code>, FCM cycles through the selected pool of healthy models, distributing requests evenly.</p>
                </div>
                <div>
                  <span className="font-semibold">Can I use this as a unified provider?</span>
                  <p className="text-zinc-400 mt-1">Yes! Set an <code>FCM Proxy API Key</code> in Settings, then point any OpenAI-compatible tool to <code>/api/completions</code> with header <code>X-API-Key</code>. Use modes: specific, group, or round-robin.</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}