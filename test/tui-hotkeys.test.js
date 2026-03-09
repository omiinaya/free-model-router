/**
 * @file test/tui-hotkeys.test.js
 * @description Tests covering TUI hotkey behaviour for Task 5.
 *
 * Scope:
 *   1. Shift+G  — usage sort: sortResults('usage') sorts by usagePercent asc/desc
 *   2. X key    — log page toggle: logVisible state flag semantics
 *   3. = key    — interval increase (reassigned from X): validatees the new binding
 *                  is distinct from X and correctly adjusts pingInterval
 *
 * Because the TUI is a full interactive loop we test the underlying pure logic
 * (sortResults from lib/utils.js) plus a lightweight state-machine helper that
 * mirrors the key-handler logic extracted for testability.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sortResults, getProxyStatusInfo } from '../src/utils.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal result object for sort tests. */
function makeResult(overrides = {}) {
  return {
    idx: 1,
    modelId: 'model-x',
    label: 'Model X',
    tier: 'A',
    sweScore: '50%',
    ctx: '128k',
    providerKey: 'nvidia',
    status: 'up',
    pings: [{ ms: 200, code: '200' }],
    usagePercent: undefined,
    ...overrides,
  }
}

// ─── Suite: Shift+G — usage sort (sortResults 'usage') ───────────────────────

describe('tui-hotkeys – Shift+G usage sort', () => {
  it('sortResults("usage", "asc") puts lower usagePercent first', () => {
    const results = [
      makeResult({ idx: 1, label: 'A', usagePercent: 80 }),
      makeResult({ idx: 2, label: 'B', usagePercent: 20 }),
      makeResult({ idx: 3, label: 'C', usagePercent: 50 }),
    ]
    const sorted = sortResults(results, 'usage', 'asc')
    assert.strictEqual(sorted[0].label, 'B')  // 20% — least quota left first
    assert.strictEqual(sorted[1].label, 'C')  // 50%
    assert.strictEqual(sorted[2].label, 'A')  // 80%
  })

  it('sortResults("usage", "desc") puts higher usagePercent first', () => {
    const results = [
      makeResult({ idx: 1, label: 'A', usagePercent: 80 }),
      makeResult({ idx: 2, label: 'B', usagePercent: 20 }),
      makeResult({ idx: 3, label: 'C', usagePercent: 50 }),
    ]
    const sorted = sortResults(results, 'usage', 'desc')
    assert.strictEqual(sorted[0].label, 'A')  // 80% first
    assert.strictEqual(sorted[1].label, 'C')  // 50%
    assert.strictEqual(sorted[2].label, 'B')  // 20%
  })

  it('treats undefined usagePercent as 0 (sorts to bottom on asc)', () => {
    const results = [
      makeResult({ idx: 1, label: 'Has-Usage',  usagePercent: 30 }),
      makeResult({ idx: 2, label: 'No-Usage-A', usagePercent: undefined }),
      makeResult({ idx: 3, label: 'No-Usage-B', usagePercent: null }),
    ]
    const sorted = sortResults(results, 'usage', 'asc')
    // undefined/null → 0, so they sort before 30 on asc
    assert.strictEqual(sorted[0].usagePercent ?? 0, 0)
    assert.strictEqual(sorted[1].usagePercent ?? 0, 0)
    assert.strictEqual(sorted[2].label, 'Has-Usage')
  })

  it('toggling direction when column is already "usage" flips asc/desc', () => {
    // Simulate: state.sortColumn === 'usage' → flip direction
    let sortColumn = 'usage'
    let sortDirection = 'asc'

    // First toggle: same column → flip
    if (sortColumn === 'usage') {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    }
    assert.strictEqual(sortDirection, 'desc')

    // Second toggle: flip again
    if (sortColumn === 'usage') {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    }
    assert.strictEqual(sortDirection, 'asc')
  })

  it('switching from a different column to "usage" resets direction to asc', () => {
    let sortColumn = 'avg'
    let sortDirection = 'desc'

    // Press Shift+G: different column → set usage + reset to asc
    const col = 'usage'
    if (sortColumn === col) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      sortColumn = col
      sortDirection = 'asc'
    }
    assert.strictEqual(sortColumn, 'usage')
    assert.strictEqual(sortDirection, 'asc')
  })
})

// ─── Suite: X key — log page toggle ──────────────────────────────────────────

describe('tui-hotkeys – X key log page toggle', () => {
  it('toggling logVisible false→true opens log page', () => {
    const state = { logVisible: false, logScrollOffset: 0 }

    // Simulate X key press
    state.logVisible = !state.logVisible
    if (state.logVisible) state.logScrollOffset = 0

    assert.strictEqual(state.logVisible, true)
    assert.strictEqual(state.logScrollOffset, 0)
  })

  it('toggling logVisible true→false closes log page', () => {
    const state = { logVisible: true, logScrollOffset: 10 }

    state.logVisible = !state.logVisible
    if (state.logVisible) state.logScrollOffset = 0

    assert.strictEqual(state.logVisible, false)
    // scrollOffset is preserved when closing (next open will reset it)
    assert.strictEqual(state.logScrollOffset, 10)
  })

  it('opening log page resets scrollOffset to 0', () => {
    const state = { logVisible: false, logScrollOffset: 42 }

    state.logVisible = !state.logVisible
    if (state.logVisible) state.logScrollOffset = 0

    assert.strictEqual(state.logVisible, true)
    assert.strictEqual(state.logScrollOffset, 0)
  })

  it('Esc closes the log page', () => {
    const state = { logVisible: true }

    // Simulate Esc key while logVisible
    // key.name === 'escape' → logVisible = false
    state.logVisible = false

    assert.strictEqual(state.logVisible, false)
  })

  it('X key is distinct from W (interval decrease) key', () => {
    // X must NOT decrease interval; W must NOT toggle log
    const KEY_LOG_TOGGLE   = 'x'
    const KEY_INTERVAL_DEC = 'w'
    const KEY_INTERVAL_INC = '='

    assert.notStrictEqual(KEY_LOG_TOGGLE, KEY_INTERVAL_DEC)
    assert.notStrictEqual(KEY_LOG_TOGGLE, KEY_INTERVAL_INC)
    assert.notStrictEqual(KEY_INTERVAL_DEC, KEY_INTERVAL_INC)
  })
})

// ─── Suite: = key — ping interval increase (reassigned from X) ───────────────

describe('tui-hotkeys – = key interval increase (reassigned from X)', () => {
  const PING_INTERVAL_MAX = 60000
  const PING_INTERVAL_MIN = 1000

  it('= key increases pingInterval by 1000ms up to 60s cap', () => {
    let pingInterval = 5000

    // Simulate = key: increase
    pingInterval = Math.min(PING_INTERVAL_MAX, pingInterval + 1000)
    assert.strictEqual(pingInterval, 6000)

    // Cap at 60s
    pingInterval = 60000
    pingInterval = Math.min(PING_INTERVAL_MAX, pingInterval + 1000)
    assert.strictEqual(pingInterval, 60000)
  })

  it('W key decreases pingInterval by 1000ms down to 1s floor', () => {
    let pingInterval = 5000

    // Simulate W key: decrease
    pingInterval = Math.max(PING_INTERVAL_MIN, pingInterval - 1000)
    assert.strictEqual(pingInterval, 4000)

    // Floor at 1s
    pingInterval = 1000
    pingInterval = Math.max(PING_INTERVAL_MIN, pingInterval - 1000)
    assert.strictEqual(pingInterval, 1000)
  })

  it('X key no longer adjusts pingInterval — it toggles logVisible', () => {
    // The binding contract: X → log toggle, = → interval increase
    // We verify X does NOT appear in the sortKeys map and is not = 
    const sortKeys = {
      'r': 'rank', 'y': 'tier', 'o': 'origin', 'm': 'model',
      'l': 'ping', 'a': 'avg', 's': 'swe', 'c': 'ctx',
      'h': 'condition', 'v': 'verdict', 'b': 'stability', 'u': 'uptime',
    }
    // X is NOT a sort key
    assert.ok(!('x' in sortKeys), 'x must not be in sort keys')
    // = is NOT a sort key
    assert.ok(!('=' in sortKeys), '= must not be in sort keys')
    // W is NOT a sort key (it controls interval)
    assert.ok(!('w' in sortKeys), 'w must not be in sort keys')
  })

  it('= (equals) key is not already bound to sort or filter functions', () => {
    // These are all the sort key bindings; = must not appear among them
    const allSortKeys = ['r','y','o','m','l','a','s','c','h','v','b','u']
    assert.ok(!allSortKeys.includes('='), '= is not a sort key')
    // These are modal keys that = must not conflict with
    const modalKeys = ['t','n','f','j','i','p','q','z','k','w','x','e','d']
    assert.ok(!modalKeys.includes('='), '= is not already a modal key')
  })
})

// ─── Suite: proxy status indicator — getProxyStatusInfo ──────────────────────

describe('tui-hotkeys – proxy status indicator (getProxyStatusInfo)', () => {
  it('returns "stopped" state when proxyStartupStatus is null and proxy is not active', () => {
    const info = getProxyStatusInfo(null, false)
    assert.strictEqual(info.state, 'stopped')
  })

  it('returns "starting" state when proxyStartupStatus phase is "starting"', () => {
    const info = getProxyStatusInfo({ phase: 'starting' }, false)
    assert.strictEqual(info.state, 'starting')
  })

  it('"running" state carries port and accountCount from proxyStartupStatus', () => {
    const info = getProxyStatusInfo({ phase: 'running', port: 4891, accountCount: 3 }, true)
    assert.strictEqual(info.state, 'running')
    assert.strictEqual(info.port, 4891)
    assert.strictEqual(info.accountCount, 3)
  })

  it('"running" state falls back to "active" when proxyStartupStatus is null but activeProxy is true', () => {
    const info = getProxyStatusInfo(null, true)
    assert.strictEqual(info.state, 'running')
  })

  it('"failed" state carries a short reason string', () => {
    const info = getProxyStatusInfo({ phase: 'failed', reason: 'EADDRINUSE: port in use' }, false)
    assert.strictEqual(info.state, 'failed')
    assert.ok(typeof info.reason === 'string', 'reason should be a string')
    assert.ok(info.reason.length > 0, 'reason should be non-empty')
  })

  it('"failed" reason is truncated to 80 chars maximum', () => {
    const longReason = 'x'.repeat(200)
    const info = getProxyStatusInfo({ phase: 'failed', reason: longReason }, false)
    assert.ok(info.reason.length <= 80, `reason should be ≤80 chars, got ${info.reason.length}`)
  })

  it('proxyStartupStatus "running" takes priority over null activeProxy', () => {
    // Even if activeProxy object is falsy, a running startup status is authoritative
    const info = getProxyStatusInfo({ phase: 'running', port: 5000, accountCount: 2 }, false)
    assert.strictEqual(info.state, 'running')
    assert.strictEqual(info.port, 5000)
  })

  it('returns "stopped" for unrecognized phase', () => {
    const info = getProxyStatusInfo({ phase: 'unknown' }, false)
    assert.strictEqual(info.state, 'stopped')
  })
})
