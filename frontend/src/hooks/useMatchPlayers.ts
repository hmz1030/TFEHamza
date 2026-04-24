import { useCallback, useEffect, useState } from 'react'
import { getMatchPlayers } from '../services/matchService'
import type { Player } from '../types'

export function useMatchPlayers(matchId: number) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)

  const fetchPlayers = useCallback(async (canUpdate: () => boolean = () => true) => {
    if (!Number.isInteger(matchId) || matchId <= 0) return
    try {
      const { data } = await getMatchPlayers(matchId)
      if (canUpdate()) setPlayers(data)
    } catch {
      if (canUpdate()) setPlayers([])
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

  return { players, loadingPlayers, refetchPlayers: () => fetchPlayers() }
}
