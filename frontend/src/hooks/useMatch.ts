import { useEffect, useState } from 'react'
import type { Match, Pronostic, Rating, Vote } from '../types'
import { getMatch } from '../services/matchService'
import { getPronostics } from '../services/pronosticService'
import { getRatings } from '../services/ratingService'
import { getVotes } from '../services/voteService'

interface UseMatchResult {
  match: Match | null
  ratings: Rating[]
  votes: Vote[]
  pronostics: Pronostic[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMatch(matchId: number): UseMatchResult {
  const [match, setMatch] = useState<Match | null>(null)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [pronostics, setPronostics] = useState<Pronostic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatchData = async (canUpdate = () => true) => {
    if (!Number.isInteger(matchId) || matchId <= 0) {
      if (canUpdate()) {
        setMatch(null)
        setRatings([])
        setVotes([])
        setPronostics([])
        setError('Identifiant de match invalide.')
        setLoading(false)
      }

      return
    }

    try {
      if (canUpdate()) {
        setLoading(true)
        setError(null)
      }

      const [matchResponse, ratingsResponse, votesResponse, pronosticsResponse] = await Promise.all([
        getMatch(matchId),
        getRatings(matchId),
        getVotes(matchId),
        getPronostics(matchId),
      ])

      if (canUpdate()) {
        setMatch(matchResponse.data)
        setRatings(ratingsResponse.data)
        setVotes(votesResponse.data)
        setPronostics(pronosticsResponse.data)
      }
    } catch {
      if (canUpdate()) {
        setError('Impossible de charger les details du match.')
      }
    } finally {
      if (canUpdate()) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    let isActive = true

    void fetchMatchData(() => isActive)

    return () => {
      isActive = false
    }
  }, [matchId])

  return {
    match,
    ratings,
    votes,
    pronostics,
    loading,
    error,
    refetch: () => fetchMatchData(),
  }
}
