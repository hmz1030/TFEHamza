import api from './api'
import type { Match, Player } from '../types'

export const getMatches = () =>
  api.get<Match[]>('/matches/')

export const getMatchesByDate = (date: string) =>
  api.get<Match[]>('/matches/', {
    params: { date },
  })

export const getTodayMatches = () =>
  api.get<Match[]>('/matches/today/')

export const syncTodayMatches = (date?: string, daysAhead = 0) =>
  api.post<{ detail: string; output: string }>('/dev/sync-matches/', {
    ...(date ? { date } : {}),
    ...(daysAhead > 0 ? { days_ahead: daysAhead } : {}),
  })

export const syncMatchPlayers = (matchId: number) =>
  api.post<{ detail: string; output: string }>('/dev/sync-players/', { match_id: matchId })

export const getMatch = (id: number) =>
  api.get<Match>(`/matches/${id}/`)

export const getMatchPlayers = (matchId: number) =>
  api.get<Player[]>(`/matches/${matchId}/players/`)
