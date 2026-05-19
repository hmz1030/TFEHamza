import api from './api'
import type { LeaderboardEntry, PronosticGroup, PronosticGroupMember } from '../types'

export const getPronosticGroups = () =>
  api.get<PronosticGroup[]>('/pronostic-groups/')

export const createPronosticGroup = (name: string) =>
  api.post<PronosticGroup>('/pronostic-groups/', { name })

export const getPronosticGroup = (groupId: number) =>
  api.get<PronosticGroup>(`/pronostic-groups/${groupId}/`)

export const getPronosticGroupInvitations = () =>
  api.get<PronosticGroupMember[]>('/pronostic-groups/invitations/')

export const invitePronosticGroupMember = (groupId: number, userId: number) =>
  api.post<PronosticGroupMember>(`/pronostic-groups/${groupId}/invite/`, { user: userId })

export const respondToPronosticGroupInvite = (groupId: number, action: 'accept' | 'refuse') =>
  api.post<PronosticGroupMember>(`/pronostic-groups/${groupId}/respond/`, { action })

export const leavePronosticGroup = (groupId: number) =>
  api.post<{ detail: string }>(`/pronostic-groups/${groupId}/leave/`)

export const getPronosticGroupLeaderboard = (groupId: number) =>
  api.get<LeaderboardEntry[]>(`/pronostic-groups/${groupId}/leaderboard/`)
