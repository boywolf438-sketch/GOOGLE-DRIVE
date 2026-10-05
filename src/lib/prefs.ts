/** Tiny, dependency-free preference store (localStorage + in-tab subscriptions). */

const AUTOREPLY_KEY = 'ibnuhajar.autoreply'
const AUTOREPLY_EVENT = 'ibnuhajar:autoreply'

function safeGlobal(): Window | null {
  return typeof window !== 'undefined' ? window : null
}

export function getAutoReply(): boolean {
  const win = safeGlobal()
  if (!win) return true
  try {
    return win.localStorage.getItem(AUTOREPLY_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setAutoReply(enabled: boolean): void {
  const win = safeGlobal()
  if (!win) return
  try {
    win.localStorage.setItem(AUTOREPLY_KEY, enabled ? 'on' : 'off')
  } catch {
    /* storage unavailable — preference simply will not persist */
  }
  win.dispatchEvent(new Event(AUTOREPLY_EVENT))
}

/** Subscribe to preference changes made in this tab or another one. */
export function subscribeAutoReply(listener: (enabled: boolean) => void): () => void {
  const win = safeGlobal()
  if (!win) return () => {}
  const local = () => listener(getAutoReply())
  const remote = (event: StorageEvent) => {
    if (event.key === AUTOREPLY_KEY) listener(getAutoReply())
  }
  win.addEventListener(AUTOREPLY_EVENT, local)
  win.addEventListener('storage', remote)
  return () => {
    win.removeEventListener(AUTOREPLY_EVENT, local)
    win.removeEventListener('storage', remote)
  }
}
