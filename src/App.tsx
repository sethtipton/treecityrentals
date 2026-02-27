import { useMemo } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { Link, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import SiteLayout from './components/SiteLayout'
import ContactPage from './components/ContactPage'
import SmartImage from './components/SmartImage'
import useDocumentMeta from './hooks/useDocumentMeta'
import { EmptyState, ErrorState, LoadingState } from './components/UiStates'

import './App.css'

const EMPTY_RENTALS: RentalNode[] = []

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

const GET_RENTAL_BY_SLUG = gql`
  query GetRentalBySlug($slug: String!) {
    rentals(where: { name: $slug, status: PUBLISH }, first: 1) {
      nodes {
        id
        title
        slug
        uri
        content
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
  content?: string | null
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

type GetRentalBySlugData = {
  rentals: {
    nodes: RentalNode[]
  }
}

type GetRentalBySlugVars = {
  slug: string
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
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function stripHtml(html?: string | null) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function truncate(text: string, max = 155) {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

function DebugPageList() {
  const { loading, error, data } = useQuery<GetPagesData>(GET_PAGES)
  useDocumentMeta({
    title: 'Debug | Tree City Rentals',
    description: 'Development-only route for WPGraphQL connection checks.',
  })
  return (
    <SiteLayout>
      <h1 className="page-title">Tree City Rentals (Frontend)</h1>
      <p className="page-subtle">WPGraphQL connection test + route links</p>

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

          <ul className="stack" style={{ paddingLeft: '1.25rem' }}>
            {data.pages.nodes.map((page) => {
              const frontendPath = page.slug === 'home' ? '/' : page.uri

              return (
                <li key={page.id}>
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
                        className="responsive-image"
                        style={{ maxWidth: '220px' }}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </SiteLayout>
  )
}

function WpPageView({ uri }: { uri: string }) {
  const { loading, error, data } = useQuery<GetPageByUriData, GetPageByUriVars>(GET_PAGE_BY_URI, {
    variables: { uri },
  })

  const featuredImage = data?.page?.featuredImage?.node
  const pageTitle = data?.page?.title ? `${data.page.title} | Tree City Rentals` : 'Tree City Rentals'
  const pageDescription = data?.page?.content
    ? truncate(stripHtml(data.page.content))
    : 'Tree City Rentals property information and tenant resources.'
  
  useDocumentMeta({
    title: pageTitle,
    description: pageDescription,
  })
  return (
    <SiteLayout>
      {loading && (
        <LoadingState title="Loading page" message="Fetching content from WordPress…" />
      )}

      {error && (
        <ErrorState
          title="Page failed to load"
          message={`GraphQL error: ${error.message}`}
        />
      )}

      {!loading && !error && !data?.page && (
        <EmptyState
          title="Page not found"
          message="This page was not found in WordPress."
        />
      )}

      {data?.page && (
        <article>
          {featuredImage?.sourceUrl && (
            <SmartImage
              src={featuredImage.sourceUrl}
              alt={featuredImage.altText || ''}
              className="responsive-image--page"
            />
          )}

          <h1 className="page-title">{data.page.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: data.page.content ?? '' }} />
        </article>
      )}
    </SiteLayout>
  )
}

function RentalsPage() {
  const { loading, error, data } = useQuery<GetRentalsData>(GET_RENTALS)
  const [searchParams, setSearchParams] = useSearchParams()

  type AvailabilityFilter = 'all' | 'available' | 'unavailable'
  type SortOption =
    | 'available-first'
    | 'rent-asc'
    | 'rent-desc'
    | 'beds-desc'
    | 'available-date-asc'

  useDocumentMeta({
    title: 'Available Rentals | Tree City Rentals',
    description: 'Browse current rental listings, pricing, bedrooms, bathrooms, and availability.',
  })

  const availabilityParam = searchParams.get('availability')
  const sortParam = searchParams.get('sort')
  const queryParam = searchParams.get('q') ?? ''

  const availabilityFilter: AvailabilityFilter =
    availabilityParam === 'available' || availabilityParam === 'unavailable' ? availabilityParam : 'all'

  const sortBy: SortOption =
    sortParam === 'rent-asc' ||
    sortParam === 'rent-desc' ||
    sortParam === 'beds-desc' ||
    sortParam === 'available-date-asc' ||
    sortParam === 'available-first'
      ? sortParam
      : 'available-first'

  const rentals = data?.rentals?.nodes ?? EMPTY_RENTALS

  function updateSearchParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)

      if (!value || value === 'all' || value === 'available-first') {
        next.delete(key)
      } else {
        next.set(key, value)
      }

      return next
    })
  }

  const filteredAndSortedRentals = useMemo(() => {
    const normalizedQuery = queryParam.trim().toLowerCase()

    const filtered = rentals
      .filter((rental) => {
        const isAvailable = rental.rentalDetails?.isAvailable ?? false

        if (availabilityFilter === 'available') return isAvailable
        if (availabilityFilter === 'unavailable') return !isAvailable
        return true
      })
      .filter((rental) => {
        if (!normalizedQuery) return true

        const details = rental.rentalDetails
        const haystack = [
          rental.title,
          details?.locationLabel,
          details?.city,
          details?.state,
          rental.slug,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(normalizedQuery)
      })

    const getRent = (rental: RentalNode) => rental.rentalDetails?.monthlyRent ?? null
    const getBeds = (rental: RentalNode) => rental.rentalDetails?.bedrooms ?? null
    const getAvailableDateMs = (rental: RentalNode) => {
      const value = rental.rentalDetails?.availableDate
      if (!value) return null
      const ms = new Date(value).getTime()
      return Number.isNaN(ms) ? null : ms
    }
    const isAvailable = (rental: RentalNode) => rental.rentalDetails?.isAvailable ?? false

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rent-asc': {
          const aRent = getRent(a)
          const bRent = getRent(b)
          if (aRent == null && bRent == null) return 0
          if (aRent == null) return 1
          if (bRent == null) return -1
          return aRent - bRent
        }

        case 'rent-desc': {
          const aRent = getRent(a)
          const bRent = getRent(b)
          if (aRent == null && bRent == null) return 0
          if (aRent == null) return 1
          if (bRent == null) return -1
          return bRent - aRent
        }

        case 'beds-desc': {
          const aBeds = getBeds(a)
          const bBeds = getBeds(b)
          if (aBeds == null && bBeds == null) return 0
          if (aBeds == null) return 1
          if (bBeds == null) return -1
          return bBeds - aBeds
        }

        case 'available-date-asc': {
          const aDate = getAvailableDateMs(a)
          const bDate = getAvailableDateMs(b)
          if (aDate == null && bDate == null) return 0
          if (aDate == null) return 1
          if (bDate == null) return -1
          return aDate - bDate
        }

        case 'available-first':
        default: {
          const aAvail = isAvailable(a)
          const bAvail = isAvailable(b)

          if (aAvail !== bAvail) return aAvail ? -1 : 1

          const aRent = getRent(a)
          const bRent = getRent(b)
          if (aRent == null && bRent == null) return 0
          if (aRent == null) return 1
          if (bRent == null) return -1
          return aRent - bRent
        }
      }
    })
  }, [rentals, availabilityFilter, sortBy, queryParam])

  return (
    <SiteLayout>
      <h1 className="page-title">Available Rentals</h1>

      <div
        className="card"
        style={{
          marginBottom: '1rem',
          display: 'grid',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: '0.75rem',
          }}
        >
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Search</span>
            <input
              type="search"
              value={queryParam}
              placeholder="Search title, city, state, neighborhood..."
              onChange={(e) => updateSearchParam('q', e.target.value)}
            />
          </label>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem 1rem',
              alignItems: 'end',
            }}
          >
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              <span>Availability</span>
              <select
                value={availabilityFilter}
                onChange={(e) => updateSearchParam('availability', e.target.value)}
              >
                <option value="all">All rentals</option>
                <option value="available">Available only</option>
                <option value="unavailable">Unavailable only</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: '0.25rem' }}>
              <span>Sort by</span>
              <select value={sortBy} onChange={(e) => updateSearchParam('sort', e.target.value)}>
                <option value="available-first">Available first</option>
                <option value="rent-asc">Rent: low to high</option>
                <option value="rent-desc">Rent: high to low</option>
                <option value="beds-desc">Bedrooms: high to low</option>
                <option value="available-date-asc">Soonest available date</option>
              </select>
            </label>

            {(queryParam || availabilityFilter !== 'all' || sortBy !== 'available-first') && (
              <button
                type="button"
                onClick={() => setSearchParams({})}
                style={{ height: 'fit-content' }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {!loading && !error && (
          <p className="page-subtle" style={{ margin: 0 }}>
            Showing {filteredAndSortedRentals.length} of {rentals.length} rentals
          </p>
        )}
      </div>

      {loading && (
        <LoadingState title="Loading rentals" message="Fetching current listings…" />
      )}

      {error && (
        <ErrorState
          title="Rentals failed to load"
          message={`GraphQL error: ${error.message}`}
        />
      )}

      {!loading && !error && rentals.length === 0 && (
        <EmptyState
          title="No rentals yet"
          message="Add a few rentals in WordPress → Rentals to populate this page."
        />
      )}

      {!loading && !error && rentals.length > 0 && filteredAndSortedRentals.length === 0 && (
        <EmptyState
          title="No matches"
          message="No rentals match the current filters/search."
        />
      )}

      <div className="stack">
        {filteredAndSortedRentals.map((rental) => {
          const details = rental.rentalDetails
          const image = rental.featuredImage?.node
          const available = details?.isAvailable ?? false

          return (
            <article key={rental.id} className="card">
              {image?.sourceUrl && (
                <SmartImage
                  src={image.sourceUrl}
                  alt={image.altText || rental.title}
                  className="responsive-image--card"
                />
              )}

              <div>
                <h2 style={{ margin: 0 }}>
                  <Link to={`/rentals/${rental.slug}`} viewTransition>
                    {rental.title}
                  </Link>
                </h2>
                <p style={{ margin: '0.25rem 0 0' }}>
                  {details?.locationLabel || 'Rental property'}
                  {(details?.city || details?.state) &&
                    ` — ${[details?.city, details?.state].filter(Boolean).join(', ')}`}
                </p>
              </div>

              <div className="meta-row">
                <span>
                  <strong>Rent:</strong> {formatCurrency(details?.monthlyRent)}
                </span>
                <span>
                  <strong>Beds:</strong> {details?.bedrooms ?? '—'}
                </span>
                <span>
                  <strong>Baths:</strong> {details?.bathrooms ?? '—'}
                </span>
                <span>
                  <strong>Sq Ft:</strong> {details?.squareFeet ?? '—'}
                </span>
                <span>
                  <strong>Available:</strong> {formatAvailableDate(details?.availableDate)}
                </span>
                <span>
                  <strong>Status:</strong> {available ? 'Available' : 'Not currently available'}
                </span>
              </div>

              {rental.excerpt && <div dangerouslySetInnerHTML={{ __html: rental.excerpt }} />}

              <div>
                <Link to={`/rentals/${rental.slug}`} viewTransition>
                  View details →
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </SiteLayout>
  )
}

function RentalDetailPage() {
  const { slug } = useParams()
  const { loading, error, data } = useQuery<GetRentalBySlugData, GetRentalBySlugVars>(GET_RENTAL_BY_SLUG, {
    variables: { slug: slug ?? '' },
    skip: !slug,
  })

  const rental = data?.rentals?.nodes?.[0]
  const details = rental?.rentalDetails
  const image = rental?.featuredImage?.node
  const isAvailable = details?.isAvailable ?? false

  const rentalTitle = rental?.title ? `${rental.title} | Tree City Rentals` : 'Rental Details | Tree City Rentals'

  const rentalDescriptionParts = [
    details?.locationLabel,
    [details?.city, details?.state].filter(Boolean).join(', '),
    details?.monthlyRent != null ? `${formatCurrency(details.monthlyRent)}/month` : '',
    details?.bedrooms != null ? `${details.bedrooms} bed` : '',
    details?.bathrooms != null ? `${details.bathrooms} bath` : '',
  ]

  const rentalDescription = rental
    ? truncate(
        rentalDescriptionParts.filter(Boolean).join(' • ') ||
          stripHtml(rental.content) ||
          'Rental details and availability information.',
      )
    : 'Rental details and availability information.'

  useDocumentMeta({
    title: rentalTitle,
    description: rentalDescription,
  })

  return (
    <SiteLayout>
      {loading && (
        <LoadingState title="Loading rental" message="Fetching rental details…" />
      )}

      {error && (
        <ErrorState
          title="Rental failed to load"
          message={`GraphQL error: ${error.message}`}
        />
      )}

      {!loading && !error && !rental && (
        <EmptyState
          title="Rental not found"
          message="This rental may have been removed or is no longer published."
        />
      )}

      {rental && (
        <article className="stack">
          {image?.sourceUrl && (
            <SmartImage
              src={image.sourceUrl}
              alt={image.altText || rental.title}
              className="responsive-image--detail"
            />
          )}

          <header>
            <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>
              {rental.title}
            </h1>
            <p style={{ margin: 0 }}>
              {details?.locationLabel || 'Rental property'}
              {(details?.city || details?.state) &&
                ` — ${[details?.city, details?.state].filter(Boolean).join(', ')}`}
            </p>
          </header>

          <div className="meta-row">
            <span>
              <strong>Rent:</strong> {formatCurrency(details?.monthlyRent)}
            </span>
            <span>
              <strong>Beds:</strong> {details?.bedrooms ?? '—'}
            </span>
            <span>
              <strong>Baths:</strong> {details?.bathrooms ?? '—'}
            </span>
            <span>
              <strong>Sq Ft:</strong> {details?.squareFeet ?? '—'}
            </span>
            <span>
              <strong>Available:</strong> {formatAvailableDate(details?.availableDate)}
            </span>
            <span>
              <strong>Status:</strong> {isAvailable ? 'Available' : 'Not currently available'}
            </span>
          </div>

          <div>
            <Link
              to={`/contact?property=${encodeURIComponent(rental.title)}&from=${encodeURIComponent(`/rentals/${rental.slug}`)}`}
              viewTransition
            >
              Inquire about this rental →
            </Link>
          </div>

          {rental.content && <div dangerouslySetInnerHTML={{ __html: rental.content }} />}
        </article>
      )}
    </SiteLayout>
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
  useDocumentMeta({
    title: 'Page Not Found | Tree City Rentals',
    description: 'The page you requested could not be found.',
  })
  return (
    <SiteLayout>
      <h1 className="page-title">Page not found</h1>
      <p>This route doesn’t exist in the frontend app.</p>
      <p>
        <Link to="/" viewTransition>
          Go back home
        </Link>
      </p>
    </SiteLayout>
  )
}

export default function App() {
  const isDev = import.meta.env.DEV

  return (
    <Routes>
      <Route path="/" element={<HomeWpRoute />} />

      {/* Rentals routes (must come before generic page slug route) */}
      <Route path="/rentals" element={<RentalsPage />} />
      <Route path="/rentals/:slug" element={<RentalDetailPage />} />

      <Route path="/contact" element={<ContactPage />} />

      {/* WP Pages by slug */}
      <Route path="/:slug" element={<SlugWpRoute />} />

      {isDev && <Route path="/_debug" element={<DebugPageList />} />}

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}