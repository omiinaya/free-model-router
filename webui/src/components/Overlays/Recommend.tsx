'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getTopRecommendations } from '@/lib/utils'
import { sources } from '@/lib/sources'
import type { ModelResult } from '@/types'

export function Recommend() {
  const { recommendOpen, setRecommendOpen, config } = useApp() as any
  const [step, setStep] = useState(0)
  const [task, setTask] = useState('quickfix')
  const [priority, setPriority] = useState('balanced')
  const [context, setContext] = useState('medium')
  const [recommendations, setRecommendations] = useState<{ result: ModelResult; score: number }[]>([])

  const buildModels = (): ModelResult[] => {
    const arr: ModelResult[] = []
    for (const [providerKey, src] of Object.entries(sources)) {
      for (const m of src.models) {
        const [modelId, label, tier, sweScore, ctx] = m as [string, string, string, string, string]
        arr.push({
          idx: 0,
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
          isFavorite: config.favorites.includes(`${providerKey}/${modelId}`),
          isRecommended: false,
          recommendScore: 0,
        })
      }
    }
    return arr
  }

  const compute = () => {
    const models = buildModels()
    const recs = getTopRecommendations(models, task, priority, context, 3)
    setRecommendations(recs)
    setStep(2)
  }

  return (
    <Dialog open={recommendOpen} onOpenChange={setRecommendOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>🔍 Smart Recommend</DialogTitle>
        </DialogHeader>
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm">Answer a few questions to find your best model.</p>
            <div>
              <label className="block text-sm mb-1">Task Type</label>
              <select className="w-full p-2 rounded bg-zinc-800" value={task} onChange={e => setTask(e.target.value)}>
                <option value="quickfix">Quick Fix</option>
                <option value="bugfix">Bug Fix</option>
                <option value="feature">Feature</option>
                <option value="refactor">Refactor</option>
                <option value="review">Review</option>
                <option value="document">Document</option>
                <option value="explore">Explore</option>
              </select>
            </div>
            <Button onClick={() => setStep(1)}>Next</Button>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Priority</label>
              <select className="w-full p-2 rounded bg-zinc-800" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="speed">Speed</option>
                <option value="quality">Quality</option>
                <option value="balanced">Balanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Context Budget</label>
              <select className="w-full p-2 rounded bg-zinc-800" value={context} onChange={e => setContext(e.target.value)}>
                <option value="small">Small (&lt;32k)</option>
                <option value="medium">Medium (32-128k)</option>
                <option value="large">Large (128-256k)</option>
                <option value="massive">Massive (256k+)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={compute}>Get Recommendations</Button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm">Top 3 recommendations:</p>
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-3 bg-zinc-800 rounded">
                <div className="font-medium">{rec.result.label}</div>
                <div className="text-xs text-zinc-400">{rec.result.providerKey} • {rec.result.tier} • Score: {rec.score}</div>
              </div>
            ))}
            <Button variant="outline" onClick={() => setRecommendOpen(false)}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}