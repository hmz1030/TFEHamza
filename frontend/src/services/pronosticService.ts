import api from './api'
import type { LeaderboardEntry, Pronostic } from '../types'

export const getPronostics = (matchId: number) =>
  api.get<Pronostic[]>(`/matches/${matchId}/pronostics/`)

export const createPronostic = (data: { match: number; home_score: number; away_score: number }) =>
  api.post<Pronostic>('/pronostics/', data)

export const getLeaderboard = () =>
  api.get<LeaderboardEntry[]>('/pronostics/leaderboard/')

export const calculatePronosticPoints = (matchId?: number) =>
  api.post<{
    updated: number
    skipped: number
    scoring: {
      exact_score: number
      correct_result: number
      wrong_result: number
    }
  }>('/pronostics/calculate-points/', {
    ...(matchId ? { match: matchId } : {}),
  })
