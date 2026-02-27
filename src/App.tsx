import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { Link, Route, Routes, useParams } from 'react-router-dom'
import './App.css'

const GET_PAGES = gql`
  query GetPages {
    pages(first: 20) {
      nodes {
        id
        title
        slug
        uri
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`

const GET_PAGE_BY_URI = gql`
  query GetPageByUri($uri: ID!) {
    page(id: $uri, idType: URI) {
      id
      title
      uri
      content
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
  }
`

const GET_RENTALS = gql`
  query GetRentals {
    rentals(first: 50, where: { status: PUBLISH }) {
      nodes {
        id
        title
        slug
        uri
        excerpt
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        rentalDetails {
          monthlyRent
          bedrooms
          bathrooms
          squareFeet
          availableDate
          isAvailable
          city
          state
          locationLabel
        }
      }
    }
  }
`

type ImageNode = {
  sourceUrl: string
  altText?: string | null
}

type PageNode = {
  id: string
  title: string
  slug: string
  uri: string
  featuredImage?: {
    node?: ImageNode | null
  } | null
}

type GetPagesData = {
  pages: {
    nodes: PageNode[]
  }
}

type GetPageByUriData = {
  page: {
    id: string
    title: string
    uri: string
    content?: string | null
    featuredImage?: {
      node?: ImageNode | null
    } | null
  } | null
}

type GetPageByUriVars = {
  uri: string
}

type RentalDetails = {
  monthlyRent?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  squareFeet?: number | null
  availableDate?: string | null
  isAvailable?: boolean | null
  city?: string | null
  state?: string | null
  locationLabel?: string | null
}

type RentalNode = {
  id: string
  title: string
  slug: string
  uri: string
  excerpt?: string | null
  featuredImage?: {
    node?: ImageNode | null
  } | null
  rentalDetails?: RentalDetails | null
}

type GetRentalsData = {
  rentals: {
    nodes: RentalNode[]
  }
}

function formatCurrency(value?: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatAvailableDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function DebugPageList() {
  const { loading, error, data } = useQuery<GetPagesData>(GET_PAGES)

  return (
    <div style={{ padding: '1.5rem', textAlign: 'left' }}>
      <h1>Tree City Rentals (Frontend)</h1>
      <p>WPGraphQL connection test + route links</p>

      <p>
        <Link to="/" viewTransition>Home</Link> ·{' '}
        <Link to="/rentals" viewTransition>Rentals</Link>
      </p>

      {loading && <p>Loading pages from WordPress...</p>}

      {error && (
        <div>
          <p>
            <strong>GraphQL error:</strong> {error.message}
          </p>
        </div>
      )}

      {data && (
        <>
          <p>
            <strong>Connected ✅</strong>
          </p>
          <h2>Pages from WordPress</h2>
          <ul>
            {data.pages.nodes.map((page) => {
              const frontendPath = page.slug === 'home' ? '/' : page.uri

              return (
                <li key={page.id} style={{ marginBottom: '1rem' }}>
                  <div>
                    <Link to={frontendPath} viewTransition>
                      {page.title || '(no title)'}
                    </Link>{' '}
                    — <code>{frontendPath}</code>
                  </div>

                  {page.featuredImage?.node?.sourceUrl && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img
                        src={page.featuredImage.node.sourceUrl}
                        alt={page.featuredImage.node.altText || ''}
                        style={{ maxWidth: '220px', height: 'auto', display: 'block' }}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

function WpPageView({ uri }: { uri: string }) {
  const { loading, error, data } = useQuery<GetPageByUriData, GetPageByUriVars>(GET_PAGE_BY_URI, {
    variables: { uri },
  })

  const featuredImage = data?.page?.featuredImage?.node

  return (
    <div style={{ padding: '1.5rem', textAlign: 'left' }}>
      <nav style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <Link to="/" viewTransition>Home</Link>
        <Link to="/rentals" viewTransition>Rentals</Link>
      </nav>

      {loading && <p>Loading page content...</p>}

      {error && (
        <div>
          <p>
            <strong>GraphQL error:</strong> {error.message}
          </p>
        </div>
      )}

      {!loading && !error && !data?.page && <p>Page not found in WordPress.</p>}

      {data?.page && (
        <article>
          {featuredImage?.sourceUrl && (
            <img
              src={featuredImage.sourceUrl}
              alt={featuredImage.altText || ''}
              style={{
                width: '100%',
                maxWidth: '800px',
                height: 'auto',
                display: 'block',
                marginBottom: '1rem',
                borderRadius: '8px',
              }}
            />
          )}

          <h1>{data.page.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: data.page.content ?? '' }} />
        </article>
      )}
    </div>
  )
}

function RentalsPage() {
  const { loading, error, data } = useQuery<GetRentalsData>(GET_RENTALS)

  return (
    <div style={{ padding: '1.5rem', textAlign: 'left' }}>
      <nav style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <Link to="/" viewTransition>Home</Link>
        <Link to="/rentals" viewTransition>Rentals</Link>
      </nav>

      <h1>Available Rentals</h1>

      {loading && <p>Loading rentals...</p>}

      {error && (
        <div>
          <p>
            <strong>GraphQL error:</strong> {error.message}
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            If this mentions <code>rentalDetails</code> or a field name, your ACF GraphQL field names may differ slightly.
          </p>
        </div>
      )}

      {!loading && !error && data?.rentals?.nodes?.length === 0 && (
        <p>No rentals found yet. Add a few in WordPress → Rentals.</p>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {data?.rentals?.nodes.map((rental) => {
          const details = rental.rentalDetails
          const image = rental.featuredImage?.node
          const isAvailable = details?.isAvailable ?? false

          return (
            <article
              key={rental.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '12px',
                padding: '1rem',
                display: 'grid',
                gap: '0.75rem',
              }}
            >
              {image?.sourceUrl && (
                <img
                  src={image.sourceUrl}
                  alt={image.altText || rental.title}
                  style={{
                    width: '100%',
                    maxWidth: '640px',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '8px',
                  }}
                />
              )}

              <div>
                <h2 style={{ margin: 0 }}>{rental.title}</h2>
                <p style={{ margin: '0.25rem 0 0' }}>
                  {details?.locationLabel || 'Rental property'}
                  {(details?.city || details?.state) &&
                    ` — ${[details?.city, details?.state].filter(Boolean).join(', ')}`}
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1rem' }}>
                <span><strong>Rent:</strong> {formatCurrency(details?.monthlyRent)}</span>
                <span><strong>Beds:</strong> {details?.bedrooms ?? '—'}</span>
                <span><strong>Baths:</strong> {details?.bathrooms ?? '—'}</span>
                <span><strong>Sq Ft:</strong> {details?.squareFeet ?? '—'}</span>
                <span><strong>Available:</strong> {formatAvailableDate(details?.availableDate)}</span>
                <span>
                  <strong>Status:</strong> {isAvailable ? 'Available' : 'Not currently available'}
                </span>
              </div>

              {rental.excerpt && (
                <div dangerouslySetInnerHTML={{ __html: rental.excerpt }} />
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function HomeWpRoute() {
  return <WpPageView uri="/home/" />
}

function SlugWpRoute() {
  const { slug } = useParams()
  return <WpPageView uri={`/${slug ?? ''}/`} />
}

function NotFoundPage() {
  return (
    <div style={{ padding: '1.5rem', textAlign: 'left' }}>
      <h1>Page not found</h1>
      <p>This route doesn’t exist in the frontend app.</p>
      <p>
        <Link to="/" viewTransition>
          Go back home
        </Link>
      </p>
    </div>
  )
}

export default function App() {
  const isDev = import.meta.env.DEV

  return (
    <Routes>
      <Route path="/" element={<HomeWpRoute />} />

      {/* Dedicated frontend route for CPT listings */}
      <Route path="/rentals" element={<RentalsPage />} />

      {/* WP Pages by slug */}
      <Route path="/:slug" element={<SlugWpRoute />} />

      {isDev && <Route path="/_debug" element={<DebugPageList />} />}

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}