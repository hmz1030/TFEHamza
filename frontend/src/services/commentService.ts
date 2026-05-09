import api from './api'
import type { Comment } from '../types'

export const getComments = (matchId: number) =>
  api.get<Comment[]>(`/matches/${matchId}/comments/`)

export const createComment = (data: { match: number; content: string; parent?: number | null }) =>
  api.post<Comment>('/comments/', data)
