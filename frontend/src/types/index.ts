// === Entités de base ===

export interface Badge {
  id: number
  name: string
  min_rated_match: number
  icon: string
}

export type BadgePreview = Pick<Badge, 'id' | 'name' | 'icon'>

export interface User {
  id: number
  username: string
  email: string
  badge: BadgePreview | null
}

export interface PublicUser {
  id: number
  username: string
  badge: BadgePreview | null
  is_following: boolean
}

export interface Team {
  id: number
  name: string
  league: string
  country: string
  logo: string
}

export interface Player {
  id: number
  name: string
  team: number
  image: string
  position: string
  number: number | null
  age: number | null
}

export interface MatchPlayer {
  id: number
  player: Player
  is_starter: boolean
  goals: number
  assists: number
  subbed_in: boolean
  subbed_out: boolean
}

export interface Match {
  id: number
  date: string
  league: string
  home_team: Team
  away_team: Team
  home_score: number | null
  away_score: number | null
  status: string
  mvp: number | null
  average_rating: number | null
}

export interface Rating {
  id: number
  score: number
  comment: string
  user: number
  user_username: string
  match: number
  created_at: string
}

export type CommentReactionValue = 'like' | 'dislike'

export interface CommentReactionResult {
  comment: number
  likes_count: number
  dislikes_count: number
  my_reaction: CommentReactionValue | null
}

export interface Comment {
  id: number
  user: number
  user_username: string
  match: number
  parent: number | null
  content: string
  likes_count: number
  dislikes_count: number
  my_reaction: CommentReactionValue | null
  created_at: string
  updated_at: string
}

export interface Vote {
  id: number
  user: number
  match: number
  player: number
  created_at: string
}

export interface Pronostic {
  id: number
  user: number
  user_username: string
  match: number
  home_score: number
  away_score: number
  points: number | null
  created_at: string
}

export interface LeaderboardEntry {
  user: {
    id: number
    username: string
    badge: BadgePreview | null
  }
  total_points: number
}

// === Auth ===

export interface AuthTokens {
  access: string
  refresh: string
}

export interface RegisterResponse {
  user: User
  tokens: AuthTokens
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}
