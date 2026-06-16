import { useState } from 'react'
import { isAxiosError } from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { reportRating } from '../../services/ratingService'

interface RatingReportButtonProps {
  ratingId: number
}

const REPORT_REASONS = [
  'Discrimination : ethnie, religion, homophobie ou transphobie',
  'Message haineux',
  'Incitation a la violence',
  'Harcelement ou intimidation',
  'Spam ou contenu hors sujet',
]

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M6 4.8c0-.5.4-.8.8-.8h9.8c.6 0 1 .6.7 1.2l-1.4 2.9 1.4 2.9c.3.6-.1 1.2-.7 1.2H7.6v7c0 .5-.4.8-.8.8s-.8-.4-.8-.8V4.8Zm1.6.8v5h7.7L14.2 8c-.1-.2-.1-.5 0-.7l1.1-1.7H7.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

function RatingReportButton({ ratingId }: RatingReportButtonProps) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0])
  const [details, setDetails] = useState('')

  const handleOpen = () => {
    if (!user) {
      toast.error('Connecte-toi pour signaler le commentaire d\'une note')
      return
    }
    setOpen(true)
  }

  const handleReport = async () => {
    setSubmitting(true)
    try {
      const reason = details.trim()
        ? `${selectedReason} - ${details.trim()}`
        : selectedReason
      await reportRating(ratingId, reason)
      toast.success('Commentaire de note signalé aux moderateurs')
      setOpen(false)
      setDetails('')
      setSelectedReason(REPORT_REASONS[0])
    } catch (error) {
      const detail = isAxiosError<{ detail?: string }>(error) ? error.response?.data?.detail : undefined
      toast.error(detail ?? 'Impossible de signaler ce commentaire de note')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        title="Signaler"
        aria-label="Signaler ce commentaire"
        disabled={submitting}
        onClick={handleOpen}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.03)] text-[var(--muted-strong)] transition hover:border-[var(--danger)] hover:text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FlagIcon />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(2,8,14,0.72)] px-3 py-4 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`report-rating-${ratingId}-title`}
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-[var(--line)] bg-[rgb(13,24,36)] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.45)] sm:rounded-[1.8rem] sm:p-6">
            <div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--danger)]">Signalement</p>
                <h2 id={`report-rating-${ratingId}-title`} className="mt-2 text-2xl font-black text-[var(--text)]">
                  Pourquoi signaler cette note ?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Choisis la raison principale. Elle aidera les moderateurs a traiter le signalement plus vite.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex cursor-pointer items-center gap-3 rounded-[1rem] border px-4 py-3 text-sm font-semibold transition ${selectedReason === reason ? 'border-[var(--danger)] bg-[rgba(216,125,116,0.12)] text-[var(--text)]' : 'border-[var(--line)] bg-[rgba(255,255,255,0.03)] text-[var(--muted-strong)] hover:border-[var(--danger)] hover:text-[var(--text)]'}`}
                >
                  <input
                    type="radio"
                    name={`report-reason-${ratingId}`}
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="h-4 w-4 accent-[var(--danger)]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-[var(--muted-strong)]">Details optionnels</span>
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={3}
                maxLength={400}
                placeholder="Ajoute un contexte si necessaire..."
                className="mt-2 w-full resize-none rounded-[1rem] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--danger)]"
              />
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="rounded-full border border-[var(--line)] px-5 py-2.5 text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--text)] disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleReport()}
                disabled={submitting}
                className="rounded-full bg-[var(--danger)] px-5 py-2.5 text-sm font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Signalement...' : 'Envoyer le signalement'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default RatingReportButton
