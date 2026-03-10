'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function FeatureRequest() {
  const { featureOpen, setFeatureOpen } = useApp() as any
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    // In a real implementation, send to a webhook or issue tracker
    // For now, just show a success toast
    await new Promise(resolve => setTimeout(resolve, 500))
    toast.success('Feature request submitted! Thank you.')
    setMessage('')
    setFeatureOpen(false)
    setSending(false)
  }

  return (
    <Dialog open={featureOpen} onOpenChange={setFeatureOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>✨ Request a Feature</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe the feature you'd like to see..."
            rows={5}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFeatureOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              {sending ? 'Sending...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}