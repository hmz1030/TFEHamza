type LoaderSize = 'sm' | 'md' | 'lg'

interface LoaderProps {
  label?: string
  size?: LoaderSize
  fullScreen?: boolean
  className?: string
}

const spinnerSizeClasses: Record<LoaderSize, string> = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
}

function Loader({
  label = 'Chargement...',
  size = 'md',
  fullScreen = false,
  className = '',
}: LoaderProps) {
  const wrapperClasses = fullScreen
    ? 'flex min-h-screen items-center justify-center'
    : 'flex items-center justify-center py-8'

  return (
    <div
      className={`${wrapperClasses} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className={`animate-spin rounded-full border-[rgba(243,239,230,0.12)] border-t-[var(--accent)] ${spinnerSizeClasses[size]}`}
        />
        {label ? <p className="text-sm font-medium text-[var(--muted)]">{label}</p> : null}
      </div>
    </div>
  )
}

export default Loader
