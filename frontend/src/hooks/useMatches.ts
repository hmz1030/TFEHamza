import { useCallback, useEffect, useState } from 'react'
import type { Match } from '../types'
import { getMatchesByDate, getTodayMatches } from '../services/matchService'
import { isLive } from '../utils/matchStatus'

interface UseMatchesResult {
  matches: Match[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

async function fetchMatchesForDate(selectedDate?: string) {
  if (selectedDate) {
    return getMatchesByDate(selectedDate)
  }

  return getTodayMatches()
}

export function useMatches(selectedDate?: string): UseMatchesResult {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(async (canUpdate: () => boolean = () => true) => {
    try {
      if (canUpdate()) {
        setLoading(true)
        setError(null)
      }

      const response = await fetchMatchesForDate(selectedDate)

      if (canUpdate()) {
        setMatches(response.data)
      }
    } catch {
      if (canUpdate()) {
        setError('Impossible de charger les matchs pour cette date.')
      }
    } finally {
      if (canUpdate()) {
        setLoading(false)
      }
    }
  }, [selectedDate])

  useEffect(() => {
    let isActive = true

    void fetchMatches(() => isActive)

    return () => {
      isActive = false
    }
  }, [fetchMatches])

  useEffect(() => {
    if (!matches.some((match) => isLive(match.status))) return

    const interval = window.setInterval(() => {
      void fetchMatches()
    }, 60000)

    return () => window.clearInterval(interval)
  }, [fetchMatches, matches])

  return { matches, loading, error, refetch: () => fetchMatches() }
}
