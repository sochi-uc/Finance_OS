import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'

type Tone = 'info' | 'success' | 'error'
interface Toast {
  id: number
  message: string
  tone: Tone
}

/** Toast queue: each toast owns its timer; announced politely to screen readers. */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const next = useRef(0)

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((l) => l.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, tone: Tone = 'success') => {
      const id = ++next.current
      setToasts((l) => [...l.slice(-2), { id, message, tone }])
      timers.current.set(id, setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 2800))
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => map.forEach(clearTimeout)
  }, [])

  return { toasts, push, dismiss }
}

export function ToastRegion({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast glass toast--${t.tone}`}>
          <Icon name={t.tone === 'error' ? 'alert' : 'check'} size={15} className="toast-icon" />
          <span>{t.message}</span>
          <button type="button" className="toast-x" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            <Icon name="close" size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
