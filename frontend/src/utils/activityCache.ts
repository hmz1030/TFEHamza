import { invalidateCachedData } from './requestCache'

export function invalidateUserActivityCache(userId?: number) {
  invalidateCachedData('profile:me:activity')

  if (!userId) return

  invalidateCachedData(`user:${userId}:activity`)
  invalidateCachedData(`user:${userId}:detail`)
}
