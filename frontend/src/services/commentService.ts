import api from './api'
import type { Comment, CommentReactionValue } from '../types'

export const getComments = (matchId: number) =>
  api.get<Comment[]>(`/matches/${matchId}/comments/`)

export const createComment = (data: { match: number; content: string; parent?: number | null }) =>
  api.post<Comment>('/comments/', data)

export const reactToComment = (commentId: number, value: CommentReactionValue) =>
  api.post<{
    comment: number
    likes_count: number
    dislikes_count: number
    my_reaction: CommentReactionValue | null
  }>(`/comments/${commentId}/reaction/`, { value })
