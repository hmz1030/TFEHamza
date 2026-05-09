import { Link } from 'react-router-dom'
import type { Comment, Match } from '../../types'

interface CommentSummaryCardProps {
  comment: Comment
  match?: Match
  title?: string
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function CommentSummaryCard({ comment, match, title = 'Commentaire' }: CommentSummaryCardProps) {
  const target = `/matches/${comment.match}?comment=${comment.id}#comment-${comment.id}`

  return (
    <Link to={target} className="block rounded-[1.4rem] border border-[var(--line)] bg-[rgba(17,27,40,0.72)] p-4 transition hover:border-[var(--accent-strong)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--muted-strong)]">{title}</p>
          {match ? <p className="mt-1 text-sm text-[var(--text)]">{match.home_team.name} vs {match.away_team.name}</p> : null}
        </div>
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{formatDate(comment.created_at)}</p>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted-strong)]">{comment.content}</p>
      {comment.parent ? <p className="mt-2 text-xs text-[var(--accent-strong)]">Réponse à un commentaire</p> : null}
    </Link>
  )
}

export default CommentSummaryCard
