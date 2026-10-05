import type { DB } from '../types'
import { createSeed, DB_VERSION } from './seed'

export const DB_STORAGE_KEY = 'ibnuhajar.db'
export const SESSION_STORAGE_KEY = 'ibnuhajar.session'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadDB(): DB {
  if (!isBrowser()) return createSeed()
  try {
    const raw = window.localStorage.getItem(DB_STORAGE_KEY)
    if (!raw) {
      const seeded = createSeed()
      saveDB(seeded)
      return seeded
    }
    const parsed = JSON.parse(raw) as DB
    if (!parsed || typeof parsed !== 'object' || parsed.version !== DB_VERSION || !Array.isArray(parsed.users)) {
      const seeded = createSeed()
      saveDB(seeded)
      return seeded
    }
    // Defensive defaults so partially written data never crashes the UI.
    return {
      ...parsed,
      users: parsed.users ?? [],
      students: parsed.students ?? [],
      subjects: parsed.subjects ?? [],
      assessments: parsed.assessments ?? [],
      results: parsed.results ?? [],
      conversations: parsed.conversations ?? [],
      messages: parsed.messages ?? [],
      announcements: parsed.announcements ?? [],
      reads: parsed.reads ?? {},
    }
  } catch (error) {
    console.warn('[MADRASAT IBNUHAJAR] Falling back to fresh demo data:', error)
    return createSeed()
  }
}

export function saveDB(db: DB): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db))
  } catch (error) {
    console.warn('[MADRASAT IBNUHAJAR] Unable to persist data:', error)
  }
}

export function resetDB(): DB {
  const seeded = createSeed()
  saveDB(seeded)
  return seeded
}

export function loadSession(): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY)
  } catch {
    return null
  }
}

export function saveSession(userId: string | null): void {
  if (!isBrowser()) return
  try {
    if (userId) window.localStorage.setItem(SESSION_STORAGE_KEY, userId)
    else window.localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
