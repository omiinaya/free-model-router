'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function Chat() {
  const { chatOpen, setChatOpen } = useApp() as any // We'll extend context
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [modelUsed, setModelUsed] = useState<string>('')

  const handleSend = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Best': 'true',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
          stream: false,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to get response')
      }

      const data = await res.json()
      setResponse(data.choices?.[0]?.message?.content || 'No response')
      setModelUsed(data.model || 'unknown')
    } catch (error) {
      toast.error('Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={chatOpen} onOpenChange={setChatOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>💬 Quick Chat (Best Model)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
            rows={3}
          />
          <Button onClick={handleSend} disabled={loading || !prompt.trim()}>
            {loading ? '⏳ Sending...' : '🚀 Send to Best Model'}
          </Button>
          {modelUsed && (
            <div className="text-xs text-zinc-400">
              Powered by: {modelUsed}
            </div>
          )}
          {response && (
            <div className="p-4 bg-zinc-800 rounded-md whitespace-pre-wrap text-sm">
              {response}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}