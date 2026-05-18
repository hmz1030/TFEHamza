import api from './api'
import type { Comment, CommentReactionResult, CommentReactionValue, CommentReport } from '../types'

export const getComments = (matchId: number) =>
  api.get<Comment[]>(`/matches/${matchId}/comments/`)

export const createComment = (data: { match: number; content: string; parent?: number | null }) =>
  api.post<Comment>('/comments/', data)

export const reactToComment = (commentId: number, value: CommentReactionValue) =>
  api.post<CommentReactionResult>(`/comments/${commentId}/reaction/`, { value })

export const reportComment = (commentId: number, reason = '') =>
  api.post<CommentReport>(`/comments/${commentId}/report/`, { reason })
