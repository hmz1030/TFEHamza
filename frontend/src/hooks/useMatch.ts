import { useCallback, useEffect, useState } from 'react'
import type { Comment, CommentReactionResult, Match, Pronostic, Rating, Vote } from '../types'
import { getMatch } from '../services/matchService'
import { getComments } from '../services/commentService'
import { getPronostics } from '../services/pronosticService'
import { getRatings } from '../services/ratingService'
import { getVotes } from '../services/voteService'
import { isLive } from '../utils/matchStatus'

interface UseMatchResult {
  match: Match | null
  ratings: Rating[]
  comments: Comment[]
  votes: Vote[]
  pronostics: Pronostic[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateCommentReaction: (payload: CommentReactionResult) => void
}

export function useMatch(matchId: number): UseMatchResult {
  const [match, setMatch] = useState<Match | null>(null)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [pronostics, setPronostics] = useState<Pronostic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatchData = useCallback(async (canUpdate: () => boolean = () => true) => {
    if (!Number.isInteger(matchId) || matchId <= 0) {
      if (canUpdate()) {
        setMatch(null)
        setRatings([])
        setComments([])
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

      const [matchResponse, ratingsResponse, commentsResponse, votesResponse, pronosticsResponse] = await Promise.all([
        getMatch(matchId),
        getRatings(matchId),
        getComments(matchId),
        getVotes(matchId),
        getPronostics(matchId),
      ])

      if (canUpdate()) {
        setMatch(matchResponse.data)
        setRatings(ratingsResponse.data)
        setComments(commentsResponse.data)
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
  }, [matchId])

  const updateCommentReaction = useCallback((payload: CommentReactionResult) => {
    setComments((current) =>
      current.map((comment) =>
        comment.id === payload.comment
          ? {
              ...comment,
              likes_count: payload.likes_count,
              dislikes_count: payload.dislikes_count,
              my_reaction: payload.my_reaction,
            }
          : comment,
      ),
    )
  }, [])

  useEffect(() => {
    let isActive = true

    void fetchMatchData(() => isActive)

    return () => {
      isActive = false
    }
  }, [fetchMatchData])

  useEffect(() => {
    if (!match || !isLive(match.status)) return

    const interval = window.setInterval(() => {
      void fetchMatchData()
    }, 60000)

    return () => window.clearInterval(interval)
  }, [fetchMatchData, match])

  return {
    match,
    ratings,
    comments,
    votes,
    pronostics,
    loading,
    error,
    refetch: () => fetchMatchData(),
    updateCommentReaction,
  }
}
