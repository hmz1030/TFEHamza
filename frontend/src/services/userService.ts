import api from './api'
import type { BadgePreview, Comment, Match, Player, Pronostic, PublicUser, Rating, Team, User } from '../types'

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
  pronostics: Pronostic[]
  pronostics_count: number
  pronostics_total_points: number
  pronostics_next_offset: number
  pronostics_has_more: boolean
}

export interface PronosticActivityResponse {
  pronostics: Pronostic[]
  pronostics_count: number
  pronostics_total_points: number
  pronostics_next_offset: number
  pronostics_has_more: boolean
}

export interface FavoriteClub {
  id: number
  team: Team
}

export interface FriendsFeedUser {
  id: number
  username: string
  avatar_url: string
  badge: BadgePreview | null
}

export type FriendsFeedItem =
  | {
      id: string
      type: 'rating'
      created_at: string
      user: FriendsFeedUser
      match: Match
      rating: Rating
    }
  | {
      id: string
      type: 'comment'
      created_at: string
      user: FriendsFeedUser
      match: Match
      comment: Comment
    }

export interface FriendsFeedResponse {
  results: FriendsFeedItem[]
  offset: number
  limit: number
  next_offset: number
  has_more: boolean
}

export const getMyActivity = (options?: { pronosticsLimit?: number; pronosticsOffset?: number }) =>
  api.get<ActivityData>('/accounts/me/activity/', {
    params: {
      ...(options?.pronosticsLimit !== undefined ? { pronostics_limit: options.pronosticsLimit } : {}),
      ...(options?.pronosticsOffset !== undefined ? { pronostics_offset: options.pronosticsOffset } : {}),
    },
  })

export const getMyPronostics = (offset = 0, limit = 10) =>
  api.get<PronosticActivityResponse>('/accounts/me/pronostics/', {
    params: { offset, limit },
  })

export const getFriendsFeed = (offset = 0, limit = 10) =>
  api.get<FriendsFeedResponse>('/accounts/friends-feed/', {
    params: { offset, limit },
  })

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

export const getUserFavoriteClubs = (userId: number) =>
  api.get<FavoriteClub[]>(`/accounts/users/${userId}/favorites/`)

export const removeFavoriteClub = (teamId: number) =>
  api.delete(`/accounts/favorites/${teamId}/`)

export const getUser = (userId: number) =>
  api.get<PublicUser>(`/accounts/users/${userId}/`)

export const searchUsers = (search: string) =>
  api.get<PublicUser[]>('/accounts/users/', { params: { search } })

export const getUserActivity = (
  userId: number,
  options?: { pronosticsLimit?: number; pronosticsOffset?: number },
) =>
  api.get<ActivityData>(`/accounts/users/${userId}/activity/`, {
    params: {
      ...(options?.pronosticsLimit !== undefined ? { pronostics_limit: options.pronosticsLimit } : {}),
      ...(options?.pronosticsOffset !== undefined ? { pronostics_offset: options.pronosticsOffset } : {}),
    },
  })

export const getUserPronostics = (userId: number, offset = 0, limit = 10) =>
  api.get<PronosticActivityResponse>(`/accounts/users/${userId}/pronostics/`, {
    params: { offset, limit },
  })
