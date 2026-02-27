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
        <div className="ui-state__spinner" aria-hidden="true" />
        <div className="ui-state__content">
          <h2 className="ui-state__title">{title}</h2>
          <p className="ui-state__message">{message}</p>
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
      <div className="card ui-state ui-state--error" role="alert">
        <div className="ui-state__content">
          <h2 className="ui-state__title">{title}</h2>
          <p className="ui-state__message">{message}</p>
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
        <div className="ui-state__content">
          <h2 className="ui-state__title">{title}</h2>
          <p className="ui-state__message">{message}</p>
          {children}
        </div>
      </div>
    )
  }