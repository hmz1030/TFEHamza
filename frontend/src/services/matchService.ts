import api from './api'
import type { Match, Player } from '../types'

export const getMatches = () =>
  api.get<Match[]>('/matches/')

export const getTodayMatches = () =>
  api.get<Match[]>('/matches/today/')

export const syncTodayMatches = () =>
  api.post<{ detail: string; output: string }>('/dev/sync-matches/')

export const getMatch = (id: number) =>
  api.get<Match>(`/matches/${id}/`)

export const getMatchPlayers = (matchId: number) =>
  api.get<Player[]>(`/matches/${matchId}/players/`)
