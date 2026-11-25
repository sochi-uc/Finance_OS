import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { ApiError } from '../api/client'
import type { BudgetLine, Dashboard, Holding, Side, WatchItem } from '../api/types'

/** Every dialog the app can open, with the data it needs. */
export type DialogSpec =
  | { kind: 'trade'; side: Side; holding?: Holding; ticker?: string }
  | { kind: 'holding'; holding?: Holding }
  | { kind: 'prices' }
  | { kind: 'fund' }
  | { kind: 'convert' }
  | { kind: 'fx' }
  | { kind: 'balances' }
  | { kind: 'fee' }
  | { kind: 'budget'; line?: BudgetLine; category?: BudgetLine['category'] }
  | { kind: 'watch'; item?: WatchItem }
  | { kind: 'dossier'; item: WatchItem }
  | { kind: 'confirm'; title: string; body: string; confirm: string; onConfirm: () => Promise<unknown> | void }

export interface AppActions {
  data: Dashboard
  run: (mutation: () => Promise<Dashboard>, opts?: { rethrowValidation?: boolean }) => Promise<boolean>
  toast: (message: string, tone?: 'info' | 'success' | 'error') => void
  open: (d: DialogSpec) => void
}

const Ctx = createContext<AppActions | null>(null)
export const ActionsProvider = Ctx.Provider

export function useApp(): AppActions {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp outside ActionsProvider')
  return v
}

/** Form submission: busy flag + server field errors mapped onto inputs. */
export function useSubmit() {
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = useCallback(async (fn: () => Promise<boolean>): Promise<boolean> => {
    setBusy(true)
    setErrors({})
    try {
      return await fn()
    } catch (err) {
      if (err instanceof ApiError && err.problem?.errors) {
        setErrors(Object.fromEntries(Object.entries(err.problem.errors).map(([k, v]) => [k, v[0] ?? 'Invalid'])))
      }
      return false
    } finally {
      setBusy(false)
    }
  }, [])
  return { busy, errors, setErrors, submit }
}

export function Slot({ children }: { children: ReactNode }) {
  return <>{children}</>
}
