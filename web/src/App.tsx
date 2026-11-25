import { useEffect, useState } from 'react'
import { api, setUnauthorizedHandler } from './api/client'
import type { User } from './api/types'
import AuthScreen from './features/AuthScreen'
import Workspace from './features/Workspace'
import { usePrivacy, useTheme } from './state/prefs'
import { Spinner } from './ui/Bits'

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined) // undefined = checking session
  const [theme, setTheme] = useTheme()
  const [privacy, togglePrivacy] = usePrivacy()

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    api.me().then(setUser, () => setUser(null))
  }, [])

  if (user === undefined) {
    return (
      <div className="splash">
        <div className="wallpaper" aria-hidden="true" />
        <Spinner label="Checking session" />
      </div>
    )
  }
  if (!user) return <AuthScreen onAuthenticated={setUser} />

  return (
    <Workspace
      user={user}
      theme={theme}
      onTheme={setTheme}
      privacy={privacy}
      onPrivacy={togglePrivacy}
      onSignOut={async () => {
        await api.logout().catch(() => {})
        setUser(null)
      }}
    />
  )
}
