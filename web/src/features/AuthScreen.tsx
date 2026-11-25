import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { User } from '../api/types'
import { Field } from '../ui/Bits'
import Icon, { BrandMark } from '../ui/Icon'

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (u: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const register = mode === 'register'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onAuthenticated(register ? await api.register(email, password, name) : await api.login(email, password))
    } catch (err) {
      setError((err as Error).message)
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="wallpaper" aria-hidden="true" />
      <main className="auth-card glass">
        <BrandMark size={58} />
        <h1>Finance OS</h1>
        <p className="muted">{register ? 'Create your private wealth workspace.' : 'Your wealth, in one private place.'}</p>
        <form className="form" onSubmit={submit}>
          {register && (
            <Field label="Name">
              <input className="input" autoComplete="name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
          )}
          <Field label="Email">
            <input className="input" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" hint={register ? 'At least 12 characters — a passphrase works well.' : undefined}>
            <input
              className="input"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              required
              minLength={register ? 12 : undefined}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && (
            <p className="form-error" role="alert">
              <Icon name="alert" size={14} /> {error}
            </p>
          )}
          <button type="submit" className="btn btn--primary btn--lg btn--block" aria-busy={busy}>
            {register ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="muted small">
          {register ? 'Already have an account?' : 'New to Finance OS?'}{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(register ? 'login' : 'register')
              setError(null)
            }}
          >
            {register ? 'Sign in' : 'Create an account'}
          </button>
        </p>
        <p className="auth-foot">
          <Icon name="key" size={13} /> Encrypted session · no third-party trackers
        </p>
      </main>
    </div>
  )
}
