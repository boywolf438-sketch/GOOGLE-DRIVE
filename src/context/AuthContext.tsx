import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Role, User } from '../types'
import { useData } from './DataContext'
import { loadSession, saveSession } from '../lib/db'
import { userById } from '../lib/selectors'

export interface SignUpInput {
  name: string
  email: string
  password: string
  role: Role
  adminCode?: string
  phone?: string
  title?: string
}

interface Result {
  ok: boolean
  error?: string
  user?: User
}

interface AuthContextValue {
  user: User | null
  ready: boolean
  signIn: (email: string, password: string) => Result
  signUp: (input: SignUpInput) => Result
  signOut: () => void
  updateProfile: (patch: Partial<User>) => Result
  changePassword: (current: string, next: string) => Result
}

const AuthContext = createContext<AuthContextValue | null>(null)

const normalize = (value: string) => value.trim().toLowerCase()

export function AuthProvider({ children }: { children: ReactNode }) {
  const { db, createUser, updateUser } = useData()
  const [userId, setUserId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = loadSession()
    if (stored && userById(db, stored)) setUserId(stored)
    setReady(true)
    // Session is only restored on the first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the signed-in user object fresh when their record changes.
  const user = useMemo(() => (userId ? userById(db, userId) ?? null : null), [db, userId])

  useEffect(() => {
    if (ready && userId && !user) {
      // Account was removed by an admin.
      setUserId(null)
      saveSession(null)
    }
  }, [ready, userId, user])

  const signIn = useCallback(
    (email: string, password: string): Result => {
      const found = db.users.find((u) => normalize(u.email) === normalize(email))
      if (!found) return { ok: false, error: 'No account found for that email address.' }
      if (found.password !== password) return { ok: false, error: 'Incorrect password. Please try again.' }
      if (!found.active) return { ok: false, error: 'This account has been deactivated. Contact the admin office.' }
      setUserId(found.id)
      saveSession(found.id)
      return { ok: true, user: found }
    },
    [db.users],
  )

  const signUp = useCallback(
    (input: SignUpInput): Result => {
      const name = input.name.trim()
      const email = normalize(input.email)
      if (name.length < 3) return { ok: false, error: 'Please enter your full name.' }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email address.' }
      if (input.password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
      if (db.users.some((u) => normalize(u.email) === email)) {
        return { ok: false, error: 'An account with that email already exists.' }
      }
      if (input.role === 'admin' && input.adminCode?.trim() !== db.school.adminCode) {
        return { ok: false, error: 'Invalid admin access code.' }
      }
      const created = createUser({
        name,
        email,
        password: input.password,
        role: input.role,
        phone: input.phone?.trim() || undefined,
        title:
          input.title?.trim() ||
          (input.role === 'parent' ? 'Parent' : input.role === 'teacher' ? 'Teacher' : 'School Admin'),
        active: true,
      })
      setUserId(created.id)
      saveSession(created.id)
      return { ok: true, user: created }
    },
    [db.users, db.school.adminCode, createUser],
  )

  const signOut = useCallback(() => {
    setUserId(null)
    saveSession(null)
  }, [])

  const updateProfile = useCallback(
    (patch: Partial<User>): Result => {
      if (!userId) return { ok: false, error: 'Not signed in.' }
      if (patch.email) {
        const email = normalize(patch.email)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email address.' }
        if (db.users.some((u) => u.id !== userId && normalize(u.email) === email)) {
          return { ok: false, error: 'Another account already uses that email.' }
        }
        patch = { ...patch, email }
      }
      updateUser(userId, patch)
      return { ok: true }
    },
    [userId, db.users, updateUser],
  )

  const changePassword = useCallback(
    (current: string, next: string): Result => {
      if (!user) return { ok: false, error: 'Not signed in.' }
      if (user.password !== current) return { ok: false, error: 'Your current password is incorrect.' }
      if (next.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' }
      updateUser(user.id, { password: next })
      return { ok: true }
    },
    [user, updateUser],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, signIn, signUp, signOut, updateProfile, changePassword }),
    [user, ready, signIn, signUp, signOut, updateProfile, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
