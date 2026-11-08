type ErrorStateProps = {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    // role="alert" makes screen readers announce the error as soon as it appears
    <div role="alert" className="error">
      <p>Couldn't load frost data: {message}</p>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
