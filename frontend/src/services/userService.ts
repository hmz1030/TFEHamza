import api from './api'
import type { User, Team } from '../types'

export interface ActivityData {
  ratings: {
    id: number
    score: number
    comment: string
    match: number
    created_at: string
  }[]
  votes: {
    id: number
    match: number
    player: number
    created_at: string
  }[]
  pronostics: {
    id: number
    match: number
    home_score: number
    away_score: number
    points: number | null
    created_at: string
  }[]
}

export const getMyActivity = () =>
  api.get<ActivityData>('/accounts/me/activity/')

export const followUser = (followeeId: number) =>
  api.post('/accounts/follow/', { followee: followeeId })

export const unfollowUser = (followeeId: number) =>
  api.delete(`/accounts/unfollow/${followeeId}/`)

export const addFavoriteClub = (teamId: number) =>
  api.post<{ id: number; user: number; team: Team }>('/accounts/favorites/', { team: teamId })

export const removeFavoriteClub = (teamId: number) =>
  api.delete(`/accounts/favorites/${teamId}/`)

export const getUser = (userId: number) =>
  api.get<User>(`/accounts/users/${userId}/`)
