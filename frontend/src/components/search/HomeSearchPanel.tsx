import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getTeams } from '../../services/teamService'
import { searchUsers } from '../../services/userService'
import type { PublicUser, Team } from '../../types'
import { LEAGUES, type LeagueFilterValue } from '../match/LeagueFilter'
import UserAvatar from '../user/UserAvatar'

type SearchTab = 'teams' | 'leagues' | 'users'

interface HomeSearchPanelProps {
  onClose: () => void
  onSelectLeague: (league: LeagueFilterValue) => void
}

const tabs: { id: SearchTab; label: string; icon: string }[] = [
  { id: 'teams', label: 'Equipes', icon: 'T' },
  { id: 'leagues', label: 'Ligues', icon: 'L' },
  { id: 'users', label: 'Users', icon: 'U' },
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function HomeSearchPanel({ onClose, onSelectLeague }: HomeSearchPanelProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SearchTab>('teams')
  const [query, setQuery] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<PublicUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    getTeams()
      .then((response) => setTeams(response.data))
      .catch(() => setTeams([]))
  }, [])

  useEffect(() => {
    const trimmedQuery = query.trim()
    if (activeTab !== 'users' || !user || trimmedQuery.length < 3) {
      setUsers([])
      return
    }

    const timeout = window.setTimeout(() => {
      setLoadingUsers(true)
      searchUsers(trimmedQuery)
        .then((response) => setUsers(response.data))
        .catch(() => setUsers([]))
        .finally(() => setLoadingUsers(false))
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [activeTab, query, user])

  const normalizedQuery = normalize(query.trim())
  const filteredTeams = useMemo(() => {
    if (normalizedQuery.length < 3) return []

    return teams
      .filter((team) => normalize(`${team.name} ${team.league}`).includes(normalizedQuery))
      .slice(0, 8)
  }, [normalizedQuery, teams])

  const filteredLeagues = useMemo(() => {
    if (normalizedQuery.length < 3) return []

    return LEAGUES
      .filter((league) => league !== 'Toutes')
      .filter((league) => normalize(league).includes(normalizedQuery))
  }, [normalizedQuery])

  const selectLeague = (league: string) => {
    if (LEAGUES.includes(league as LeagueFilterValue)) {
      onSelectLeague(league as LeagueFilterValue)
      onClose()
    }
  }

  const showEmptyHint = query.trim().length < 3

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(7,12,19,0.72)] px-4 py-6 backdrop-blur-md">
      <div className="mx-auto max-w-3xl rounded-[1.8rem] border border-[var(--line)] bg-[rgba(24,38,53,0.98)] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.45)]">
        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.2rem] border border-[var(--line)] bg-white/[0.04] px-4 py-3">
            <svg className="h-5 w-5 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6Zm5.2-1.6 4.5 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tape au moins 3 caracteres..."
              className="w-full bg-transparent text-base font-semibold text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-14 w-14 items-center justify-center rounded-[1.1rem] border border-[var(--line)] bg-white/[0.04] text-2xl font-bold text-[var(--muted-strong)] transition hover:border-[var(--line-strong)] hover:text-[var(--text)]"
            aria-label="Fermer la recherche"
          >
            x
          </button>
        </div>

        <div className="mt-5 inline-flex rounded-[1.2rem] border border-[var(--line)] bg-white/[0.04] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-[0.95rem] px-4 py-2.5 text-sm font-bold transition ${
                activeTab === tab.id
                  ? 'bg-[var(--accent)] text-[var(--bg-deep)]'
                  : 'text-[var(--muted-strong)] hover:text-[var(--text)]'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[14rem] pt-8">
          {showEmptyHint ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-[var(--line)] bg-white/[0.04] text-3xl text-[var(--muted)]">
                {activeTab === 'teams' ? 'T' : activeTab === 'leagues' ? 'L' : 'U'}
              </div>
              <p className="mt-6 text-xl font-bold text-[var(--text)]">
                {activeTab === 'teams' ? 'Trouver une equipe' : activeTab === 'leagues' ? 'Trouver une ligue' : 'Trouver un utilisateur'}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">Tape au moins 3 caracteres pour rechercher.</p>
            </div>
          ) : activeTab === 'teams' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredTeams.map((team) => (
                <Link
                  key={team.id}
                  to={`/teams/${team.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--line)] bg-white/[0.03] p-3 text-left transition hover:border-[var(--accent-strong)]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white p-1.5">
                    {team.logo ? <img src={team.logo} alt={team.name} className="h-full w-full object-contain" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-[var(--text)]">{team.name}</span>
                    <span className="text-sm text-[var(--muted)]">{team.league}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : activeTab === 'leagues' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredLeagues.map((league) => (
                <button
                  key={league}
                  type="button"
                  onClick={() => selectLeague(league)}
                  className="rounded-[1.1rem] border border-[var(--line)] bg-white/[0.03] p-4 text-left font-bold text-[var(--text)] transition hover:border-[var(--accent-strong)]"
                >
                  {league}
                </button>
              ))}
            </div>
          ) : !user ? (
            <p className="rounded-[1.2rem] border border-[var(--line)] bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
              Connecte-toi pour rechercher des utilisateurs.
            </p>
          ) : loadingUsers ? (
            <p className="text-sm text-[var(--muted)]">Recherche en cours...</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {users.map((result) => (
                <Link
                  key={result.id}
                  to={`/users/${result.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--line)] bg-white/[0.03] p-3 transition hover:border-[var(--accent-strong)]"
                >
                  <UserAvatar username={result.username} avatarUrl={result.avatar_url} size="sm" />
                  <span className="font-bold text-[var(--text)]">{result.username}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomeSearchPanel
