import api from './api'
import type { LeaderboardPage, Pronostic } from '../types'

export const getPronostics = (matchId: number) =>
  api.get<Pronostic[]>(`/matches/${matchId}/pronostics/`)

export const createPronostic = (data: { match: number; home_score: number; away_score: number }) =>
  api.post<Pronostic>('/pronostics/', data)

export const getLeaderboard = (page = 1, pageSize = 10) =>
  api.get<LeaderboardPage>(`/pronostics/leaderboard/?page=${page}&page_size=${pageSize}`)

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
