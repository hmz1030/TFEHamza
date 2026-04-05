import { useEffect, useState } from 'react'
import { getMatchPlayers } from '../services/matchService'
import type { Player } from '../types'

export function useMatchPlayers(matchId: number) {
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    if (!Number.isInteger(matchId) || matchId <= 0) return
    let active = true
    void getMatchPlayers(matchId).then(({ data }) => active && setPlayers(data)).catch(() => active && setPlayers([]))
    return () => { active = false }
  }, [matchId])

  return { players }
}
