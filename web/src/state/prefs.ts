import { useCallback, useEffect, useRef, useState } from 'react'

export type Theme = 'system' | 'light' | 'dark'
const THEMES: Theme[] = ['system', 'light', 'dark']

function readPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null
    return v && allowed.includes(v) ? v : fallback // validate anything read from storage
  } catch {
    return fallback
  }
}

function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage disabled: preference just won't persist */
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readPref('fos.theme', THEMES, 'dark'))
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    writePref('fos.theme', theme)
  }, [theme])
  return [theme, setTheme] as const
}

/** Privacy mode blurs every amount until hovered — for opening a wealth app in public. Remembered per device. */
export function usePrivacy() {
  const [hidden, setHidden] = useState(() => readPref('fos.privacy', ['on', 'off'] as const, 'off') === 'on')
  useEffect(() => {
    document.documentElement.classList.toggle('privacy', hidden)
    writePref('fos.privacy', hidden ? 'on' : 'off')
  }, [hidden])
  const toggle = useCallback(() => setHidden((h) => !h), [])
  return [hidden, toggle] as const
}

export const VIEWS = ['overview', 'investments', 'cash', 'budget', 'research', 'journal', 'settings'] as const
export type View = (typeof VIEWS)[number]

const fromHash = (): View => {
  const v = window.location.hash.replace(/^#\/?/, '') as View
  return VIEWS.includes(v) ? v : 'overview'
}

/** View lives in the URL hash: refresh, back/forward and deep links all work. */
export function useView() {
  const [view, setView] = useState<View>(fromHash)
  useEffect(() => {
    const on = () => setView(fromHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = useCallback((v: View) => {
    window.location.hash = `/${v}`
  }, [])
  return [view, go] as const
}

function isEditable(el: EventTarget | null) {
  const e = el as HTMLElement | null
  return !!e && (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.tagName === 'SELECT' || e.isContentEditable)
}

/** Single-key shortcuts; ⌘/Ctrl+K is always allowed. Ignored while typing or when a dialog is open. */
export function useHotkeys(map: Record<string, (e: KeyboardEvent) => void>) {
  const ref = useRef(map)
  ref.current = map
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ref.current['mod+k']?.(e)
        return
      }
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      if (isEditable(e.target) || document.querySelector('dialog[open]')) return
      const h = ref.current[e.key.toLowerCase()]
      if (h) {
        e.preventDefault()
        h(e)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])
}
