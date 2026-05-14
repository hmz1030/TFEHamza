import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import FavoriteClubCard from '../components/user/FavoriteClubCard'
import CommentSummaryCard from '../components/comment/CommentSummaryCard'
import PronosticSummaryCard from '../components/pronostic/PronosticSummaryCard'
import FollowStats from '../components/user/FollowStats'
import UserAvatar from '../components/user/UserAvatar'
import UserBadge from '../components/user/UserBadge'
import Loader from '../components/ui/Loader'
import { useAuth } from '../context/AuthContext'
import { addFavoriteClub, getFavoriteClubs, getMyActivity, removeFavoriteClub, updateProfile, type ActivityData, type FavoriteClub } from '../services/userService'
import { getMatches } from '../services/matchService'
import { getTeams } from '../services/teamService'
import type { Match, Team } from '../types'

function Profile() {
  const { user, updateUser } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteClub[]>([])
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [addingFavorite, setAddingFavorite] = useState(false)
  const [showClubPicker, setShowClubPicker] = useState(false)
  const [teamQuery, setTeamQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'ratings' | 'comments' | 'votes' | 'pronostics'>('ratings')
  const [error, setError] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileBio, setProfileBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    Promise.all([getFavoriteClubs(), getMyActivity(), getTeams(), getMatches()])
      .then(([favoritesResponse, activityResponse, teamsResponse, matchesResponse]) => {
        setFavorites(favoritesResponse.data)
        setActivity(activityResponse.data)
        setTeams(teamsResponse.data)
        setMatches(matchesResponse.data)
      })
      .catch(() => setError('Impossible de charger le profil.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setProfileBio(user?.bio ?? '')
  }, [user?.bio])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('')
      return
    }

    const nextPreview = URL.createObjectURL(avatarFile)
    setAvatarPreview(nextPreview)

    return () => URL.revokeObjectURL(nextPreview)
  }, [avatarFile])

  const handleRemoveFavorite = async (teamId: number) => {
    try {
      await removeFavoriteClub(teamId)
      setFavorites((current) => current.filter((favorite) => favorite.team.id !== teamId))
      toast.success('Club retire des favoris.')
    } catch {
      toast.error('Impossible de retirer ce club.')
    }
  }

  const handleAddFavorite = async (team: Team) => {
    setAddingFavorite(true)
    try {
      const response = await addFavoriteClub(team.id)
      setFavorites((current) => [...current, { id: response.data.id, team }])
      setShowClubPicker(false)
      setTeamQuery('')
      toast.success('Club ajoute aux favoris.')
    } catch {
      toast.error("Impossible d'ajouter ce club.")
    } finally {
      setAddingFavorite(false)
    }
  }

  const handleSaveProfile = async () => {
    const data = new FormData()
    data.append('bio', profileBio.trim())
    if (avatarFile) data.append('avatar', avatarFile)

    setSavingProfile(true)
    try {
      const response = await updateProfile(data)
      updateUser(response.data)
      setAvatarFile(null)
      setEditingProfile(false)
      toast.success('Profil mis a jour.')
    } catch {
      toast.error('Impossible de mettre a jour le profil.')
    } finally {
      setSavingProfile(false)
    }
  }

  const favoriteTeamIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.team.id)),
    [favorites],
  )
  const filteredTeams = useMemo(() => {
    const query = teamQuery.trim().toLowerCase()

    return teams
      .filter((team) => !favoriteTeamIds.has(team.id))
      .filter((team) => !query || team.name.toLowerCase().includes(query))
      .slice(0, 8)
  }, [favoriteTeamIds, teamQuery, teams])

  const matchById = useMemo(
    () => new Map(matches.map((match) => [match.id, match])),
    [matches],
  )
  const totalPoints = useMemo(
    () => activity?.pronostics.reduce((sum, pronostic) => sum + (pronostic.points ?? 0), 0) ?? 0,
    [activity],
  )
  const notesCount = activity?.ratings.length ?? 0

  const activityLabel =
    activeTab === 'ratings'
      ? activity?.ratings.length
        ? `${activity.ratings.length} note(s) envoyee(s)`
        : 'Aucune note pour le moment.'
      : activeTab === 'comments'
        ? activity?.comments.length
          ? `${activity.comments.length} commentaire(s) publie(s)`
          : 'Aucun commentaire pour le moment.'
      : activeTab === 'votes'
        ? activity?.votes.length
          ? `${activity.votes.length} vote(s) MVP enregistre(s)`
          : 'Aucun vote pour le moment.'
        : activity?.pronostics.length
          ? `${activity.pronostics.length} pronostic(s) saisi(s)`
          : 'Aucun pronostic pour le moment.'

  if (!user) return null
  if (loading) return <Loader label="Chargement du profil..." />

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <UserAvatar username={user.username} avatarUrl={avatarPreview || user.avatar_url} size="lg" />
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Mon profil</p>
                <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--text)]">{user.username}</h1>
                <p className="mt-2 text-sm text-[var(--muted)]">{user.email}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <UserBadge badge={user.badge} variant="profile" />
                  <FollowStats followersCount={user.followers_count} followingCount={user.following_count} />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEditingProfile((current) => !current)}
              className="self-start rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent-strong)] hover:text-[var(--text)]"
            >
              {editingProfile ? 'Fermer' : 'Modifier mon profil'}
            </button>
          </div>

          {user.bio ? (
            <p className="mt-5 max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">{user.bio}</p>
          ) : (
            <p className="mt-5 text-sm text-[var(--muted)]">Aucune biographie pour le moment.</p>
          )}

          {editingProfile ? (
            <div className="mt-5 space-y-4 rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-4">
              <div>
                <label htmlFor="profile-bio" className="text-sm font-semibold text-[var(--muted-strong)]">
                  Biographie
                </label>
                <textarea
                  id="profile-bio"
                  value={profileBio}
                  onChange={(event) => setProfileBio(event.target.value)}
                  rows={4}
                  maxLength={500}
                  className="mt-2 w-full rounded-[1rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label htmlFor="profile-avatar" className="text-sm font-semibold text-[var(--muted-strong)]">
                  Photo de profil
                </label>
                <input
                  id="profile-avatar"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-sm text-[var(--muted-strong)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--bg-deep)]"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleSaveProfile()}
                disabled={savingProfile}
                className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-[1.6rem] border border-[var(--danger)]/30 bg-[rgba(127,29,29,0.18)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-4">
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
            <p className="text-sm text-[var(--muted)]">Notes</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{notesCount}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
            <p className="text-sm text-[var(--muted)]">Votes MVP</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{activity?.votes.length ?? 0}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
            <p className="text-sm text-[var(--muted)]">Commentaires</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{activity?.comments.length ?? 0}</p>
          </article>
          <article className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
            <p className="text-sm text-[var(--muted)]">Points</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[var(--text)]">{totalPoints}</p>
          </article>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text)]">Clubs favoris</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Retrouve les equipes que tu suis de pres.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowClubPicker((current) => !current)}
              className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-deep)] transition hover:bg-[var(--accent-strong)]"
            >
              {showClubPicker ? 'Fermer' : 'Ajouter'}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {showClubPicker ? (
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-4 md:col-span-2">
                <input
                  type="text"
                  value={teamQuery}
                  onChange={(event) => setTeamQuery(event.target.value)}
                  placeholder="Rechercher une equipe..."
                  className="w-full rounded-[1rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {filteredTeams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      disabled={addingFavorite}
                      onClick={() => handleAddFavorite(team)}
                      className="flex items-center justify-between rounded-[1rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-left text-sm text-[var(--text)] transition hover:border-[var(--line-strong)] disabled:opacity-60"
                    >
                      <span>{team.name}</span>
                      <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{team.league}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {favorites.length === 0 ? (
              <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
                Aucun club favori pour le moment.
              </div>
            ) : favorites.map((favorite) => (
              <FavoriteClubCard key={favorite.id} favorite={favorite} onRemove={handleRemoveFavorite} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">Activite recente</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Un apercu rapide de ce que tu as deja fait.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setActiveTab('ratings')} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'ratings' ? 'bg-[var(--accent)] text-[var(--bg-deep)]' : 'border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'}`}>Mes notes</button>
            <button type="button" onClick={() => setActiveTab('comments')} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'comments' ? 'bg-[var(--accent)] text-[var(--bg-deep)]' : 'border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'}`}>Mes commentaires</button>
            <button type="button" onClick={() => setActiveTab('votes')} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'votes' ? 'bg-[var(--accent)] text-[var(--bg-deep)]' : 'border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'}`}>Mes votes</button>
            <button type="button" onClick={() => setActiveTab('pronostics')} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'pronostics' ? 'bg-[var(--accent)] text-[var(--bg-deep)]' : 'border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'}`}>Mes pronostics</button>
          </div>

          <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
            <p className="text-sm font-semibold text-[var(--muted-strong)]">
              {activeTab === 'ratings' ? 'Dernieres notes' : activeTab === 'comments' ? 'Derniers commentaires' : activeTab === 'votes' ? 'Derniers votes' : 'Derniers pronostics'}
            </p>
            {activeTab === 'comments' && activity?.comments.length ? (
              <div className="mt-4 space-y-4">
                {activity.comments.map((comment) => (
                  <CommentSummaryCard key={comment.id} comment={comment} match={matchById.get(comment.match)} title="Commentaire publié" />
                ))}
              </div>
            ) : activeTab === 'pronostics' && activity?.pronostics.length ? (
              <div className="mt-4 space-y-4">
                {activity.pronostics.map((pronostic) => (
                  <PronosticSummaryCard
                    key={pronostic.id}
                    pronostic={pronostic}
                    match={matchById.get(pronostic.match)}
                    title="Pronostic envoyé"
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted)]">{activityLabel}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Profile
