import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getToken, setToken } from '@/lib/api/httpClient'
import type { LoginInput, RegisterInput, User } from '@/types'
import { authApi } from './authApi'

/** Whether we are still checking the stored token, logged in, or logged out. */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  /** Logs in and stores the token. */
  login: (input: LoginInput) => Promise<void>
  /** Registers, then stores the token. */
  register: (input: RegisterInput) => Promise<void>
  /** Clears the token and all cached data. */
  logout: () => void
  /** Re-fetches the current user (e.g. after joining a family). */
  refreshUser: () => Promise<void>
  /** Replaces the cached user after a profile update. */
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Holds the logged-in user for the whole app and restores the session from the saved token on load. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUserState] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (getToken() ? 'loading' : 'anonymous'))

  const applySession = useCallback((token: string, nextUser: User) => {
    setToken(token)
    setUserState(nextUser)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUserState(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me()
      setUserState(me)
      setStatus('authenticated')
    } catch {
      logout()
    }
  }, [logout])

  // Restore the session once on mount when a token is present.
  useEffect(() => {
    if (getToken()) void refreshUser()
  }, [refreshUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login: async (input) => {
        const res = await authApi.login(input)
        applySession(res.token, res.user)
      },
      register: async (input) => {
        const res = await authApi.register(input)
        applySession(res.token, res.user)
      },
      logout,
      refreshUser,
      setUser: setUserState,
    }),
    [status, user, applySession, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Accesses the auth context; throws when used outside AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
