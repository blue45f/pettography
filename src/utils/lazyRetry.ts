import { lazy } from 'react'

/**
 * Marks that a guarded reload was already attempted for a failed dynamic
 * import. The flag intentionally survives the reload and is only cleared
 * after a chunk loads successfully — clearing it eagerly would allow an
 * endless reload loop when the chunk keeps failing (e.g. offline right
 * after a deploy rotated the hashed asset names).
 */
export const CHUNK_RETRY_STORAGE_KEY = 'pettography-chunk-retry'

function hasRetried(): boolean {
  try {
    return sessionStorage.getItem(CHUNK_RETRY_STORAGE_KEY) !== null
  } catch {
    // Treat unreadable storage as "already retried" so we never reload-loop.
    return true
  }
}

function markRetried(): boolean {
  try {
    sessionStorage.setItem(CHUNK_RETRY_STORAGE_KEY, '1')
    return true
  } catch {
    return false
  }
}

function clearRetryMark(): void {
  try {
    sessionStorage.removeItem(CHUNK_RETRY_STORAGE_KEY)
  } catch {
    // Ignore: worst case the next failure throws instead of reloading once.
  }
}

/**
 * Runs a dynamic-import factory, reloading the page once when the chunk
 * fails to load (typically stale hashed assets after a deploy). A second
 * consecutive failure rethrows so the surrounding error boundary renders.
 */
export async function retryImport<T>(
  load: () => Promise<T>,
  reload: () => void = () => window.location.reload()
): Promise<T> {
  try {
    const mod = await load()
    clearRetryMark()
    return mod
  } catch (error) {
    if (hasRetried() || !markRetried()) {
      throw error
    }
    reload()
    // Keep the suspense fallback up while the page reloads.
    return new Promise<never>(() => {})
  }
}

/** Drop-in replacement for `lazy` that retries a failed chunk once via {@link retryImport}. */
export const lazyRetry: typeof lazy = (load) => lazy(() => retryImport(load))
