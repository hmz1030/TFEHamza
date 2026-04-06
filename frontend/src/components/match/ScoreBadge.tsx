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
      label: 'Pas encore noté',
      scoreClasses: 'border-[var(--line)] bg-[rgba(255,255,255,0.03)] text-[var(--muted-strong)]',
      accentClasses: 'bg-[var(--muted)]',
    }
  }

  if (averageScore > 7) {
    return {
      label: 'Très bien noté',
      scoreClasses: 'border-[rgba(121,182,141,0.24)] bg-[rgba(121,182,141,0.12)] text-[var(--success)]',
      accentClasses: 'bg-[var(--success)]',
    }
  }

  if (averageScore >= 5) {
    return {
      label: 'Avis partagés',
      scoreClasses: 'border-[rgba(200,132,73,0.28)] bg-[var(--accent-soft)] text-[var(--accent-strong)]',
      accentClasses: 'bg-[var(--accent)]',
    }
  }

  return {
    label: 'Note faible',
    scoreClasses: 'border-[rgba(216,125,116,0.24)] bg-[rgba(216,125,116,0.1)] text-[var(--danger)]',
    accentClasses: 'bg-[var(--danger)]',
  }
}

function ScoreBadge({ ratings, className = '' }: ScoreBadgeProps) {
  const averageScore = getAverageScore(ratings)
  const config = getScoreConfig(averageScore)

  return (
    <div
      className={`inline-flex items-center gap-4 rounded-[1.4rem] border px-4 py-3 ${config.scoreClasses} ${className}`.trim()}
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
