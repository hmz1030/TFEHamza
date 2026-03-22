import { useEffect, useState } from 'react'
import type { Match } from '../types'
import { getTodayMatches } from '../services/matchService'

interface UseMatchesResult {
  matches: Match[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMatches(): UseMatchesResult {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getTodayMatches()
      setMatches(response.data)
    } catch {
      setError('Impossible de charger les matchs du jour.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadMatches = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await getTodayMatches()

        if (isMounted) {
          setMatches(response.data)
        }
      } catch {
        if (isMounted) {
          setError('Impossible de charger les matchs du jour.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadMatches()

    return () => {
      isMounted = false
    }
  }, [])

  return { matches, loading, error, refetch: fetchMatches }
}
