import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import LeaderboardTable from '../components/pronostic/LeaderboardTable'
import Loader from '../components/ui/Loader'
import UserProfileLink from '../components/user/UserProfileLink'
import {
  createPronosticGroup,
  getPronosticGroup,
  getPronosticGroupInvitations,
  getPronosticGroupLeaderboard,
  getPronosticGroups,
  invitePronosticGroupMember,
  leavePronosticGroup,
  respondToPronosticGroupInvite,
  searchUsers,
} from '../services/pronosticGroupService'
import type { LeaderboardEntry, PronosticGroup, PronosticGroupMember, PublicUser } from '../types'

export function PronosticGroupsPanel() {
  const [groups, setGroups] = useState<PronosticGroup[]>([])
  const [invitations, setInvitations] = useState<PronosticGroupMember[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [userQuery, setUserQuery] = useState('')
  const [userResults, setUserResults] = useState<PublicUser[]>([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  )
  const visibleMemberships = useMemo(
    () => selectedGroup?.memberships.filter((membership) => membership.status === 'accepted' || membership.status === 'pending') ?? [],
    [selectedGroup],
  )

  const loadGroups = async () => {
    const [groupsResponse, invitationsResponse] = await Promise.all([
      getPronosticGroups(),
      getPronosticGroupInvitations(),
    ])
    setGroups(groupsResponse.data)
    setInvitations(invitationsResponse.data)
    setSelectedGroupId((current) => current ?? groupsResponse.data[0]?.id ?? null)
  }

  useEffect(() => {
    loadGroups()
      .catch(() => toast.error('Impossible de charger les groupes.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedGroupId) {
      setLeaderboard([])
      return
    }

    setDetailLoading(true)
    getPronosticGroupLeaderboard(selectedGroupId)
      .then((response) => setLeaderboard(response.data))
      .catch(() => toast.error('Impossible de charger le classement du groupe.'))
      .finally(() => setDetailLoading(false))
  }, [selectedGroupId])

  const handleCreateGroup = async () => {
    const name = newGroupName.trim()
    if (!name) return

    try {
      const response = await createPronosticGroup(name)
      setGroups((current) => [response.data, ...current])
      setSelectedGroupId(response.data.id)
      setNewGroupName('')
      toast.success('Groupe cree.')
    } catch {
      toast.error('Impossible de creer le groupe.')
    }
  }

  const handleInvitationResponse = async (groupId: number, action: 'accept' | 'refuse') => {
    try {
      await respondToPronosticGroupInvite(groupId, action)
      await loadGroups()
      toast.success(action === 'accept' ? 'Invitation acceptee.' : 'Invitation refusee.')
    } catch {
      toast.error("Impossible de repondre a l'invitation.")
    }
  }

  const handleLeaveGroup = async () => {
    if (!selectedGroupId) return

    try {
      await leavePronosticGroup(selectedGroupId)
      setGroups((current) => current.filter((group) => group.id !== selectedGroupId))
      setSelectedGroupId(null)
      setLeaderboard([])
      toast.success('Groupe quitte.')
    } catch {
      toast.error('Impossible de quitter ce groupe.')
    }
  }

  const handleUserSearch = async () => {
    const query = userQuery.trim()
    if (!query) {
      setUserResults([])
      return
    }

    try {
      const response = await searchUsers(query)
      setUserResults(response.data)
    } catch {
      toast.error('Impossible de rechercher des utilisateurs.')
    }
  }

  const handleInviteUser = async (userId: number) => {
    if (!selectedGroupId) return

    try {
      await invitePronosticGroupMember(selectedGroupId, userId)
      const response = await getPronosticGroup(selectedGroupId)
      setGroups((current) => current.map((group) => group.id === selectedGroupId ? response.data : group))
      setUserQuery('')
      setUserResults([])
      toast.success('Invitation envoyee.')
    } catch {
      toast.error("Impossible d'envoyer l'invitation.")
    }
  }

  if (loading) return <Loader label="Chargement des groupes..." />

  return (
    <div className="space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Pronostics</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Groupes privés</h1>
        </div>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <div className="space-y-4">
            <article className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
              <h2 className="text-xl font-bold">Créer un groupe</h2>
              <div className="mt-4 flex gap-3">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  placeholder="Nom du groupe"
                  className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]"
                />
                <button type="button" onClick={handleCreateGroup} className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-deep)]">
                  Créer
                </button>
              </div>
            </article>

            <article className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
              <h2 className="text-xl font-bold">Invitations</h2>
              <div className="mt-4 space-y-3">
                {invitations.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Aucune invitation en attente.</p>
                ) : invitations.map((invitation) => (
                  <div key={invitation.id} className="rounded-[1.2rem] border border-[var(--line)] bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold">{invitation.group_name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Invité par {invitation.invited_by_username || 'un membre'}</p>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => handleInvitationResponse(invitation.group, 'accept')} className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--bg-deep)]">Accepter</button>
                      <button type="button" onClick={() => handleInvitationResponse(invitation.group, 'refuse')} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-strong)]">Refuser</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
            <h2 className="text-xl font-bold">Mes groupes</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {groups.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Tu n'es encore dans aucun groupe.</p>
              ) : groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedGroupId === group.id ? 'border-[var(--accent-strong)] bg-[var(--accent-strong)]/15 text-[var(--text)]' : 'border-[var(--line)] text-[var(--muted-strong)] hover:text-[var(--text)]'}`}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </article>
        </section>

        {selectedGroup ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
            <article className="space-y-5 rounded-[1.8rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--accent-strong)]">Groupe</p>
                  <h2 className="mt-2 text-2xl font-bold">{selectedGroup.name}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">Créé par {selectedGroup.owner_username}</p>
                </div>
                <button type="button" onClick={handleLeaveGroup} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--danger)]/50 hover:text-[var(--danger)]">
                  Quitter
                </button>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Membres</h3>
                <div className="mt-3 space-y-2">
                  {visibleMemberships.map((membership) => (
                    <div key={membership.id} className="flex items-center justify-between rounded-[1rem] border border-[var(--line)] bg-white/[0.03] px-4 py-3">
                      <UserProfileLink userId={membership.user} className="font-semibold text-[var(--text)] transition hover:text-[var(--accent-strong)]">
                        {membership.username}
                      </UserProfileLink>
                      <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        {membership.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Inviter</h3>
                <div className="mt-3 flex gap-3">
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(event) => setUserQuery(event.target.value)}
                    placeholder="Rechercher un pseudo"
                    className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                  <button type="button" onClick={handleUserSearch} className="rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--muted-strong)]">
                    Chercher
                  </button>
                </div>
                {userResults.length ? (
                  <div className="mt-3 space-y-2">
                    {userResults.map((result) => (
                      <button key={result.id} type="button" onClick={() => handleInviteUser(result.id)} className="flex w-full items-center justify-between rounded-[1rem] border border-[var(--line)] bg-white/[0.03] px-4 py-3 text-left transition hover:border-[var(--line-strong)]">
                        <span className="font-semibold text-[var(--text)]">{result.username}</span>
                        <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Inviter</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>

            <div>
              {detailLoading ? <Loader label="Chargement du classement..." /> : <LeaderboardTable entries={leaderboard} />}
            </div>
          </section>
        ) : null}
    </div>
  )
}

function PronosticGroups() {
  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <PronosticGroupsPanel />
      </div>
    </div>
  )
}

export default PronosticGroups
