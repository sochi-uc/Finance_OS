import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../api/client'
import type { Dashboard } from '../api/types'

export type LiveStatus = 'connecting' | 'live' | 'offline'

/**
 * Server-authoritative portfolio state. Every mutation returns the full fresh dashboard, so the UI
 * never computes balances itself (money logic lives in one place: the domain). Other tabs and API-key
 * agents trigger a Server-Sent Events "change"; we refetch only if the version actually moved.
 */
export function usePortfolio(onError: (message: string) => void) {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState<LiveStatus>('connecting')
  const version = useRef(-1)
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  const accept = useCallback((d: Dashboard) => {
    if (d.version < version.current) return // stale reply
    version.current = d.version
    setData(d)
  }, [])

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const d = await api.portfolio(signal)
        version.current = -1
        accept(d)
        setError(null)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError((err as Error).message)
      }
    },
    [accept],
  )

  useEffect(() => {
    const ctrl = new AbortController()
    void reload(ctrl.signal)
    return () => ctrl.abort()
  }, [reload])

  // Live sync. EventSource reconnects by itself; we surface its state as a status dot.
  useEffect(() => {
    const es = new EventSource('/api/stream')
    es.addEventListener('ready', () => setLive('live'))
    es.addEventListener('change', (e) => {
      const v = Number((e as MessageEvent<string>).data)
      if (Number.isFinite(v) && v !== version.current) void reload()
    })
    es.onerror = () => setLive(es.readyState === EventSource.CLOSED ? 'offline' : 'connecting')
    return () => es.close()
  }, [reload])

  /** Runs a mutation. Returns true on success; errors are surfaced via onError (field errors rethrown). */
  const run = useCallback(
    async (mutation: () => Promise<Dashboard>, opts: { rethrowValidation?: boolean } = {}): Promise<boolean> => {
      try {
        accept(await mutation())
        return true
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          onErrorRef.current(err.message)
          void reload()
          return false
        }
        if (opts.rethrowValidation && err instanceof ApiError && err.status === 400) throw err
        onErrorRef.current((err as Error).message)
        return false
      }
    },
    [accept, reload],
  )

  return { data, error, live, reload, run }
}
