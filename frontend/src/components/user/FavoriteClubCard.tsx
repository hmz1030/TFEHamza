import type { FavoriteClub } from '../../services/userService'

interface FavoriteClubCardProps {
  favorite: FavoriteClub
  onRemove?: (teamId: number) => Promise<void> | void
}

function FavoriteClubCard({ favorite, onRemove }: FavoriteClubCardProps) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-4">
      <div className="flex items-center gap-3">
        {favorite.team.logo ? <img src={favorite.team.logo} alt="" className="h-10 w-10 rounded-full bg-white object-contain p-1" /> : null}
        <div>
          <p className="font-semibold text-[var(--text)]">{favorite.team.name}</p>
          <p className="text-sm text-[var(--muted)]">{favorite.team.league}</p>
        </div>
      </div>
      {onRemove ? (
        <button type="button" onClick={() => onRemove(favorite.team.id)} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--text)]">
          Retirer
        </button>
      ) : null}
    </article>
  )
}

export default FavoriteClubCard
