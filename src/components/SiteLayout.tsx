import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

type SiteLayoutProps = {
  children: ReactNode
}

type SiteLink = {
  to: string
  label: string
}

const PRIMARY_NAV_LINKS: SiteLink[] = [
  { to: '/', label: 'Home' },
  { to: '/homes', label: 'Houses' },
  { to: '/contact', label: 'Contact' },
]

const LEGAL_LINKS: SiteLink[] = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms-of-use', label: 'Terms of Use' },
]

const THEME_STORAGE_KEY = 'tcr-theme'

type ThemeMode = 'light' | 'dark'

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode)

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
    document.documentElement.style.colorScheme = themeMode
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="site-header-inner">
          <nav className="site-nav" aria-label="Primary">
            {PRIMARY_NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} viewTransition>
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="theme-toggle"
            aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
            onClick={() => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          >
            {themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </header>

      <main id="main-content" className="page-shell" tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-grid">
            <section>
              <h2 className="site-footer-title">Quick Links</h2>
              <nav aria-label="Footer quick links">
                <ul className="site-footer-links">
                  {PRIMARY_NAV_LINKS.map((link) => (
                    <li key={`footer-${link.to}`}>
                      <Link to={link.to} viewTransition>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </section>

            <section>
              <h2 className="site-footer-title">Legal</h2>
              <nav aria-label="Footer legal links">
                <ul className="site-footer-links">
                  {LEGAL_LINKS.map((link) => (
                    <li key={`legal-${link.to}`}>
                      <Link to={link.to} viewTransition>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </section>
          </div>

          <p className="site-footer-note">
            © {new Date().getFullYear()} Tree City Rentals. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
