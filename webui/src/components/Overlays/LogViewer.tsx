'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function LogViewer() {
  const { logOpen, setLogOpen } = useApp() as any
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    if (logOpen) {
      fetch('/api/logs')
        .then(res => res.json())
        .then(data => setLogs(data))
        .catch(() => setLogs([]))
    }
  }, [logOpen])

  return (
    <Dialog open={logOpen} onOpenChange={setLogOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>📋 Request Logs</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-zinc-700">
                <th className="px-2 py-1">Time</th>
                <th className="px-2 py-1">Provider</th>
                <th className="px-2 py-1">Model</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Messages</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx} className="border-b border-zinc-800">
                  <td className="px-2 py-1 text-zinc-400 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="px-2 py-1">{log.provider}</td>
                  <td className="px-2 py-1 truncate max-w-[200px]" title={log.model}>{log.model}</td>
                  <td className="px-2 py-1">{log.status}</td>
                  <td className="px-2 py-1">{log.messages}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <div className="p-4 text-zinc-500">No requests logged yet.</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}