import api from './api'
import type { AuthTokens, LoginCredentials, RegisterData, RegisterResponse, User } from '../types'

export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  const response = await api.post<AuthTokens>('/accounts/login/', credentials)
  return response.data
}

export async function register(data: RegisterData): Promise<AuthTokens> {
  const response = await api.post<RegisterResponse>('/accounts/register/', data)
  return response.data.tokens
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/accounts/me/')
  return response.data
}
