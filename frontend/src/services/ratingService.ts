import api from './api'
import type { CommentReport, Rating } from '../types'

export const getRatings = (matchId: number) =>
  api.get<Rating[]>(`/matches/${matchId}/ratings/`)

export const createRating = (data: { score: number; comment: string; match: number }) =>
  api.post<Rating>('/ratings/', data)

export const reportRating = (ratingId: number, reason = '') =>
  api.post<CommentReport>(`/ratings/${ratingId}/report/`, { reason })
