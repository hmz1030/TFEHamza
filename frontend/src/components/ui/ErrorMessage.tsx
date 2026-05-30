interface ErrorMessageProps {
  message: string
}

function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null

  return (
    <div className="rounded-lg border border-[var(--danger)]/30 bg-[rgba(127,29,29,0.18)] p-4 text-sm text-[var(--danger)]">
      {message}
    </div>
  )
}

export default ErrorMessage
