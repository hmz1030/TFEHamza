import api from './api'
import type { Comment, Player, PublicUser, Team, User } from '../types'

export interface ActivityData {
  ratings: {
    id: number
    score: number
    comment: string
    match: number
    created_at: string
  }[]
  comments: Comment[]
  votes: {
    id: number
    match: number
    player: number
    player_detail?: Player
    created_at: string
  }[]
  pronostics: {
    id: number
    user: number
    user_username: string
    match: number
    home_score: number
    away_score: number
    points: number | null
    created_at: string
  }[]
}

export interface FavoriteClub {
  id: number
  team: Team
}

export const getMyActivity = () =>
  api.get<ActivityData>('/accounts/me/activity/')

export const updateProfile = (data: FormData) =>
  api.patch<User>('/accounts/me/profile/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const followUser = (followeeId: number) =>
  api.post('/accounts/follow/', { followee: followeeId })

export const unfollowUser = (followeeId: number) =>
  api.delete(`/accounts/unfollow/${followeeId}/`)

export const addFavoriteClub = (teamId: number) =>
  api.post<{ id: number; user: number; team: Team }>('/accounts/favorites/add/', { team: teamId })

export const getFavoriteClubs = () =>
  api.get<FavoriteClub[]>('/accounts/favorites/')

export const removeFavoriteClub = (teamId: number) =>
  api.delete(`/accounts/favorites/${teamId}/`)

export const getUser = (userId: number) =>
  api.get<PublicUser>(`/accounts/users/${userId}/`)

export const searchUsers = (search: string) =>
  api.get<PublicUser[]>('/accounts/users/', { params: { search } })

export const getUserActivity = (userId: number) =>
  api.get<ActivityData>(`/accounts/users/${userId}/activity/`)
