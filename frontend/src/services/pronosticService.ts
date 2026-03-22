import api from './api'
import type { Pronostic } from '../types'

export const getPronostics = (matchId: number) =>
  api.get<Pronostic[]>(`/matches/${matchId}/pronostics/`)

export const createPronostic = (data: { match: number; home_score: number; away_score: number }) =>
  api.post<Pronostic>('/pronostics/', data)
