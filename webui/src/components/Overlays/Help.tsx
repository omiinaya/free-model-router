'use client'

import { useApp } from '@/context/AppContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export function Help() {
  const { helpOpen, setHelpOpen } = useApp()

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>❓ Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          <div className="space-y-6 pr-4">
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
              <h3 className="text-lg font-semibold mb-3">Columns (sort)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-yellow-400 font-mono">R</span> Rank</div>
                <div><span className="text-yellow-400 font-mono">T</span> Tier</div>
                <div><span className="text-yellow-400 font-mono">O</span> Provider</div>
                <div><span className="text-yellow-400 font-mono">M</span> Model</div>
                <div><span className="text-yellow-400 font-mono">L</span> Latest ping</div>
                <div><span className="text-yellow-400 font-mono">A</span> Average ping</div>
                <div><span className="text-yellow-400 font-mono">S</span> SWE-bench score</div>
                <div><span className="text-yellow-400 font-mono">C</span> Context window</div>
                <div><span className="text-yellow-400 font-mono">H</span> Health status</div>
                <div><span className="text-yellow-400 font-mono">V</span> Verdict</div>
                <div><span className="text-yellow-400 font-mono">B</span> Stability</div>
                <div><span className="text-yellow-400 font-mono">U</span> Uptime %</div>
                <div><span className="text-yellow-400 font-mono">G</span> Usage %</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">CLI Flags</h3>
              <div className="space-y-1 text-sm text-zinc-400 font-mono">
                <div>--opencode - OpenCode CLI mode</div>
                <div>--opencode-desktop - OpenCode Desktop mode</div>
                <div>--openclaw - OpenClaw mode</div>
                <div>--best - Only top tiers (A+, S, S+)</div>
                <div>--fiable - 10s reliability analysis</div>
                <div>--tier S|A|B|C - Filter by tier</div>
                <div>--no-telemetry - Disable analytics</div>
                <div>--profile &lt;name&gt; - Load profile</div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}