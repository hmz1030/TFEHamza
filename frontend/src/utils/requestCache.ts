const cache = new Map<string, unknown>()

export function getCachedData<T>(key: string) {
  return cache.get(key) as T | undefined
}

export function setCachedData<T>(key: string, value: T) {
  cache.set(key, value)
}

export function invalidateCachedData(key: string) {
  cache.delete(key)
}

export function updateCachedData<T>(key: string, updater: (current: T) => T) {
  const current = getCachedData<T>(key)
  if (current === undefined) return
  setCachedData(key, updater(current))
}

export async function resolveCachedData<T>(
  key: string,
  loader: () => Promise<T>,
  force = false,
) {
  if (!force) {
    const cached = getCachedData<T>(key)
    if (cached !== undefined) return cached
  }

  const data = await loader()
  setCachedData(key, data)
  return data
}
