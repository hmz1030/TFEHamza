interface TeamActivityProgressProps {
  ratedMatches: number
  totalMatches: number
  percentage: number
}

function TeamActivityProgress({ ratedMatches, totalMatches, percentage }: TeamActivityProgressProps) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const safePercentage = Math.min(100, Math.max(0, percentage))
  const strokeDashoffset = circumference - (circumference * safePercentage) / 100

  return (
    <div className="rounded-[1.4rem] bg-white/[0.035] p-5 text-center">
      <p className="text-sm text-[var(--muted)]">Progression</p>

      <div className="mx-auto mt-4 h-40 w-40">
        <svg className="h-full w-full" viewBox="0 0 100 100" role="progressbar" aria-valuenow={safePercentage} aria-valuemin={0} aria-valuemax={100}>
          <circle
            className="stroke-[rgba(255,255,255,0.10)]"
            strokeWidth="10"
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
          />
          <circle
            className="origin-center -rotate-90 stroke-[var(--accent-strong)] transition-[stroke-dashoffset] duration-300"
            strokeWidth="10"
            strokeLinecap="round"
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
          <text x="50" y="47" textAnchor="middle" className="fill-[var(--text)] text-[1rem] font-black">
            {safePercentage}%
          </text>
          <text x="50" y="61" textAnchor="middle" className="fill-[var(--muted)] text-[0.42rem] font-bold uppercase tracking-[0.12em]">
            {ratedMatches}/{totalMatches} matchs
          </text>
        </svg>
      </div>
    </div>
  )
}

export default TeamActivityProgress
