import type { Rating } from '../../types'
import UserProfileLink from '../user/UserProfileLink'

interface RatingListProps {
  ratings: Rating[]
}

function formatRatingDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function RatingList({ ratings }: RatingListProps) {
  const sortedRatings = [...ratings].sort((first, second) =>
    new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
  )

  if (sortedRatings.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.6)] p-5 text-sm text-[var(--muted)]">
        Aucune note pour le moment.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedRatings.map((rating) => (
        <article key={rating.id} className="rounded-[1.6rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <UserProfileLink userId={rating.user} className="text-sm font-semibold text-[var(--text)] transition hover:text-[var(--accent-strong)]">
                {rating.user_username}
              </UserProfileLink>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                {formatRatingDate(rating.created_at)}
              </p>
            </div>
            <div className="rounded-full border border-[rgba(200,132,73,0.3)] bg-[var(--accent-soft)] px-3 py-1.5 text-sm font-bold text-[var(--accent-strong)]">
              {rating.score}/10
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">
            {rating.comment ? 'Avis affiché dans la discussion.' : 'Aucun avis associé à cette note.'}
          </p>
        </article>
      ))}
    </div>
  )
}

export default RatingList
