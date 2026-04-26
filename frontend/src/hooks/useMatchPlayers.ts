import { useCallback, useEffect, useState } from 'react'
import { getMatchPlayers } from '../services/matchService'
import type { MatchPlayer } from '../types'

export function useMatchPlayers(matchId: number) {
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)

  const fetchPlayers = useCallback(async (canUpdate: () => boolean = () => true) => {
    if (!Number.isInteger(matchId) || matchId <= 0) return
    try {
      const { data } = await getMatchPlayers(matchId)
      if (canUpdate()) setMatchPlayers(data)
    } catch {
      if (canUpdate()) setMatchPlayers([])
    } finally {
      if (canUpdate()) setLoadingPlayers(false)
    }
  }, [matchId])

  useEffect(() => {
    let active = true
    setLoadingPlayers(true)
    void fetchPlayers(() => active)
    return () => { active = false }
  }, [fetchPlayers])

  const players = matchPlayers.map((mp) => mp.player)

  return { matchPlayers, players, loadingPlayers, refetchPlayers: () => fetchPlayers() }
}
