'use client'

import { useState, useEffect, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type TimeFilter = 'all' | 'hour' | '24h'

export function LogViewer() {
  const { logOpen, setLogOpen } = useApp() as any
  const [logs, setLogs] = useState<any[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')

  useEffect(() => {
    if (logOpen) {
      fetch('/api/logs')
        .then(res => res.json())
        .then(data => setLogs(data))
        .catch(() => setLogs([]))
    }
  }, [logOpen])

  const filteredLogs = useMemo(() => {
    if (timeFilter === 'all') return logs
    const now = Date.now()
    const cutoff = now - (timeFilter === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
    return logs.filter(log => new Date(log.timestamp).getTime() >= cutoff)
  }, [logs, timeFilter])

  const totalTokens = useMemo(() => {
    return filteredLogs.reduce((sum, log) => sum + (log.tokens || 0), 0)
  }, [filteredLogs])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }

  return (
    <Dialog open={logOpen} onOpenChange={setLogOpen}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>📋 Request Logs</DialogTitle>
        </DialogHeader>
        
        {/* Time filter */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-zinc-400">Time range:</span>
          <Button size="sm" variant={timeFilter === 'all' ? 'default' : 'outline'} onClick={() => setTimeFilter('all')}>All</Button>
          <Button size="sm" variant={timeFilter === 'hour' ? 'default' : 'outline'} onClick={() => setTimeFilter('hour')}>Last hour</Button>
          <Button size="sm" variant={timeFilter === '24h' ? 'default' : 'outline'} onClick={() => setTimeFilter('24h')}>Last 24h</Button>
          <span className="ml-auto text-sm text-zinc-400">
            Total tokens: {formatNumber(totalTokens)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-zinc-700">
                <th className="px-2 py-1">Time</th>
                <th className="px-2 py-1">Provider</th>
                <th className="px-2 py-1">Model</th>
                <th className="px-2 py-1">Route</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Latency</th>
                <th className="px-2 py-1">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => (
                <tr key={idx} className="border-b border-zinc-800">
                  <td className="px-2 py-1 text-zinc-400 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="px-2 py-1">{log.provider}</td>
                  <td className="px-2 py-1 truncate max-w-[200px]" title={log.model}>{log.model}</td>
                  <td className="px-2 py-1 text-zinc-400 text-xs truncate max-w-[150px]" title={log.route}>{log.route || '-'}</td>
                  <td className="px-2 py-1">{log.status}</td>
                  <td className="px-2 py-1">{log.latency != null ? `${log.latency}ms` : '-'}</td>
                  <td className="px-2 py-1">{log.tokens != null ? formatNumber(log.tokens) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && <div className="p-4 text-zinc-500">No requests logged yet.</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}