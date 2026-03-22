import api from './api'
import type { Team } from '../types'

export const getTeams = () =>
  api.get<Team[]>('/teams/')

export const getTeam = (id: number) =>
  api.get<Team>(`/teams/${id}/`)
