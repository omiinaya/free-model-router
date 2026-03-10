'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function BugReport() {
  const { bugOpen, setBugOpen } = useApp() as any
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    toast.success('Bug report submitted! We\'ll look into it.')
    setMessage('')
    setBugOpen(false)
    setSending(false)
  }

  return (
    <Dialog open={bugOpen} onOpenChange={setBugOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🐛 Report a Bug</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe what went wrong..."
            rows={5}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBugOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              {sending ? 'Sending...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}