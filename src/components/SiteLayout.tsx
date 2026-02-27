import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type SiteLayoutProps = {
  children: ReactNode
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <nav className="site-nav" aria-label="Primary">
          <Link to="/" viewTransition>
            Home
          </Link>
          <Link to="/rentals" viewTransition>
            Rentals
          </Link>
          <Link to="/contact" viewTransition>
            Contact
          </Link>
        </nav>
      </header>

      <main className="page-shell">{children}</main>
    </div>
  )
}