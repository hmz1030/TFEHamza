import { useCallback, useEffect, useState } from 'react'
import { getMatchPlayers } from '../services/matchService'
import type { MatchPlayer } from '../types'
import { getCachedData, resolveCachedData } from '../utils/requestCache'

export function useMatchPlayers(matchId: number) {
  const cacheKey = `match:${matchId}:players`
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)

  const fetchPlayers = useCallback(async (
    canUpdate: () => boolean = () => true,
    options: { force?: boolean } = {},
  ) => {
    if (!Number.isInteger(matchId) || matchId <= 0) return
    try {
      const data = await resolveCachedData(
        cacheKey,
        async () => {
          const response = await getMatchPlayers(matchId)
          return response.data
        },
        options.force,
      )
      if (canUpdate()) setMatchPlayers(data)
    } catch {
      if (canUpdate()) setMatchPlayers([])
    } finally {
      if (canUpdate()) setLoadingPlayers(false)
    }
  }, [cacheKey, matchId])

  useEffect(() => {
    let active = true

    const cached = getCachedData<MatchPlayer[]>(cacheKey)
    if (cached) {
      setMatchPlayers(cached)
      setLoadingPlayers(false)
    } else {
      setLoadingPlayers(true)
      void fetchPlayers(() => active)
    }

    return () => { active = false }
  }, [cacheKey, fetchPlayers])

  const players = matchPlayers.map((mp) => mp.player)

  return { matchPlayers, players, loadingPlayers, refetchPlayers: () => fetchPlayers(undefined, { force: true }) }
}
