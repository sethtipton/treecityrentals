type StateMessageProps = {
    title?: string
    message: string
    children?: React.ReactNode
  }
  
  export function LoadingState({
    title = 'Loading…',
    message = 'Please wait a moment.',
    children,
  }: StateMessageProps) {
    return (
      <div className="card ui-state" aria-live="polite" aria-busy="true">
        <div className="ui-state-spinner" aria-hidden="true" />
        <div className="ui-state-content">
          <h2 className="ui-state-title">{title}</h2>
          <p className="ui-state-message">{message}</p>
          {children}
        </div>
      </div>
    )
  }
  
  export function ErrorState({
    title = 'Something went wrong',
    message,
    children,
  }: StateMessageProps) {
    return (
      <div className="card ui-state ui-state-error" role="alert">
        <div className="ui-state-content">
          <h2 className="ui-state-title">{title}</h2>
          <p className="ui-state-message">{message}</p>
          {children}
        </div>
      </div>
    )
  }
  
  export function EmptyState({
    title = 'Nothing here yet',
    message,
    children,
  }: StateMessageProps) {
    return (
      <div className="card ui-state">
        <div className="ui-state-content">
          <h2 className="ui-state-title">{title}</h2>
          <p className="ui-state-message">{message}</p>
          {children}
        </div>
      </div>
    )
  }