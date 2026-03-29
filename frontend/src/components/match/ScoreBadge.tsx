import type { Rating } from '../../types'

interface ScoreBadgeProps {
  ratings: Rating[]
  className?: string
}

function getAverageScore(ratings: Rating[]) {
  if (ratings.length === 0) {
    return null
  }

  const total = ratings.reduce((sum, rating) => sum + rating.score, 0)
  return total / ratings.length
}

function getScoreConfig(averageScore: number | null) {
  if (averageScore === null) {
    return {
      label: 'Pas encore note',
      scoreClasses: 'bg-slate-800/80 text-slate-300 ring-white/10',
      accentClasses: 'bg-slate-400/70',
    }
  }

  if (averageScore > 7) {
    return {
      label: 'Tres bien note',
      scoreClasses: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20',
      accentClasses: 'bg-emerald-400',
    }
  }

  if (averageScore >= 5) {
    return {
      label: 'Avis mitiges',
      scoreClasses: 'bg-amber-500/15 text-amber-300 ring-amber-400/20',
      accentClasses: 'bg-amber-400',
    }
  }

  return {
    label: 'Note faible',
    scoreClasses: 'bg-rose-500/15 text-rose-300 ring-rose-400/20',
    accentClasses: 'bg-rose-400',
  }
}

function ScoreBadge({ ratings, className = '' }: ScoreBadgeProps) {
  const averageScore = getAverageScore(ratings)
  const config = getScoreConfig(averageScore)

  return (
    <div
      className={`inline-flex items-center gap-4 rounded-2xl px-4 py-3 ring-1 ${config.scoreClasses} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${config.accentClasses}`} aria-hidden="true" />
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] opacity-80">
            Note moyenne
          </p>
          <p className="mt-1 text-sm font-medium">{config.label}</p>
        </div>
      </div>

      <div className="min-w-[4.5rem] text-right">
        <p className="text-2xl font-black tracking-tight">
          {averageScore === null ? '--' : averageScore.toFixed(1)}
        </p>
        <p className="text-xs font-medium opacity-75">
          {ratings.length} avis
        </p>
      </div>
    </div>
  )
}

export default ScoreBadge
