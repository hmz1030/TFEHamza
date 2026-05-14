import api from './api'
import type { Team, TeamOverview } from '../types'

export const getTeams = () =>
  api.get<Team[]>('/teams/')

export const getTeam = (id: number) =>
  api.get<Team>(`/teams/${id}/`)

export const getTeamOverview = (id: number, season: number) =>
  api.get<TeamOverview>(`/teams/${id}/overview/`, {
    params: { season },
  })
