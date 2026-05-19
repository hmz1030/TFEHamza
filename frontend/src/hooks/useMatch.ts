import { useCallback, useEffect, useState } from 'react'
import type { Comment, CommentReactionResult, Match, Pronostic, Rating, Vote } from '../types'
import { getMatch } from '../services/matchService'
import { getComments } from '../services/commentService'
import { getPronostics } from '../services/pronosticService'
import { getRatings } from '../services/ratingService'
import { getVotes } from '../services/voteService'
import { isLive } from '../utils/matchStatus'
import { getCachedData, resolveCachedData, updateCachedData } from '../utils/requestCache'

interface MatchCacheData {
  match: Match
  ratings: Rating[]
  comments: Comment[]
  votes: Vote[]
  pronostics: Pronostic[]
}

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
  const cacheKey = `match:${matchId}:detail`
  const [match, setMatch] = useState<Match | null>(null)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [pronostics, setPronostics] = useState<Pronostic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applyMatchData = useCallback((data: MatchCacheData) => {
    setMatch(data.match)
    setRatings(data.ratings)
    setComments(data.comments)
    setVotes(data.votes)
    setPronostics(data.pronostics)
  }, [])

  const fetchMatchData = useCallback(async (
    canUpdate: () => boolean = () => true,
    options: { force?: boolean } = {},
  ) => {
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

      const data = await resolveCachedData<MatchCacheData>(
        cacheKey,
        async () => {
          const [matchResponse, ratingsResponse, commentsResponse, votesResponse, pronosticsResponse] = await Promise.all([
            getMatch(matchId),
            getRatings(matchId),
            getComments(matchId),
            getVotes(matchId),
            getPronostics(matchId),
          ])

          return {
            match: matchResponse.data,
            ratings: ratingsResponse.data,
            comments: commentsResponse.data,
            votes: votesResponse.data,
            pronostics: pronosticsResponse.data,
          }
        },
        options.force,
      )

      if (canUpdate()) {
        applyMatchData(data)
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
  }, [applyMatchData, cacheKey, matchId])

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
    updateCachedData<MatchCacheData>(cacheKey, (current) => ({
      ...current,
      comments: current.comments.map((comment) =>
        comment.id === payload.comment
          ? {
              ...comment,
              likes_count: payload.likes_count,
              dislikes_count: payload.dislikes_count,
              my_reaction: payload.my_reaction,
            }
          : comment,
      ),
    }))
  }, [cacheKey])

  useEffect(() => {
    let isActive = true

    const cached = getCachedData<MatchCacheData>(cacheKey)
    if (cached) {
      applyMatchData(cached)
      setLoading(false)
      setError(null)
    } else {
      void fetchMatchData(() => isActive)
    }

    return () => {
      isActive = false
    }
  }, [applyMatchData, cacheKey, fetchMatchData])

  useEffect(() => {
    if (!match || !isLive(match.status)) return

    const interval = window.setInterval(() => {
      void fetchMatchData(undefined, { force: true })
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
    refetch: () => fetchMatchData(undefined, { force: true }),
    updateCommentReaction,
  }
}
