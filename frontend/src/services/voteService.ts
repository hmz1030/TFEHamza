import api from './api'
import type { Vote } from '../types'

export const getVotes = (matchId: number) =>
  api.get<Vote[]>(`/matches/${matchId}/votes/`)

export const createVote = (data: { match: number; player: number }) =>
  api.post<Vote>('/votes/', data)
