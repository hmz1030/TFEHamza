import api from './api'
import type { Match, MatchPlayer } from '../types'

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

export const syncLiveScores = (date?: string, force = false) =>
  api.post<{ detail: string; output: string }>('/dev/sync-live-scores/', {
    ...(date ? { date } : {}),
    ...(force ? { force: true } : {}),
  })

export const syncLineups = (options?: {
  matchId?: number
  all?: boolean
  windowBeforeHours?: number
  recentHours?: number
}) =>
  api.post<{ detail: string; output: string }>('/dev/sync-lineups/', {
    ...(options?.matchId ? { match_id: options.matchId } : {}),
    ...(options?.all ? { all: true } : {}),
    ...(options?.windowBeforeHours !== undefined
      ? { window_before_hours: options.windowBeforeHours }
      : {}),
    ...(options?.recentHours !== undefined ? { recent_hours: options.recentHours } : {}),
  })

export const syncSquads = (options?: {
  matchId?: number
  teamApiId?: string
  league?: string
  all?: boolean
}) =>
  api.post<{ detail: string; output: string }>('/dev/sync-squads/', {
    ...(options?.matchId ? { match_id: options.matchId } : {}),
    ...(options?.teamApiId ? { team_api_id: options.teamApiId } : {}),
    ...(options?.league ? { league: options.league } : {}),
    ...(options?.all ? { all: true } : {}),
  })

export const getMatch = (id: number) =>
  api.get<Match>(`/matches/${id}/`)

export const getMatchPlayers = (matchId: number) =>
  api.get<MatchPlayer[]>(`/matches/${matchId}/players/`)
