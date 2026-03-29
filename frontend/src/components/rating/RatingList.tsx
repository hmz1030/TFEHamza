import type { Rating } from '../../types'

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
      <div className="rounded-[1.75rem] bg-slate-900/60 p-5 text-sm text-slate-400 ring-1 ring-white/5">
        Aucune note pour le moment.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedRatings.map((rating) => (
        <article key={rating.id} className="rounded-[1.75rem] bg-slate-900/70 p-5 ring-1 ring-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-100">{rating.user_username}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                {formatRatingDate(rating.created_at)}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-500/15 px-3 py-1.5 text-sm font-bold text-blue-300">
              {rating.score}/10
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            {rating.comment || 'Aucun commentaire laisse.'}
          </p>
        </article>
      ))}
    </div>
  )
}

export default RatingList
