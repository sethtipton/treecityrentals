import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { flushSync } from 'react-dom'
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
  type NavigateFunction,
} from 'react-router-dom'
import SiteLayout from './components/SiteLayout'
import ContactPage from './components/ContactPage'
import SmartImage from './components/SmartImage'
import useDocumentMeta from './hooks/useDocumentMeta'
import { EmptyState, ErrorState, LoadingState } from './components/UiStates'
import { markRouteTransitionEnd, markRouteTransitionStart } from './performance'

import './App.scss'

const EMPTY_RENTALS: RentalNode[] = []
const FEATURED_RENTALS_LIMIT = 3
const RENTAL_IMAGE_VIEW_TRANSITION = 'rentalimage'
const RENTAL_DETAIL_MAIN_VIEW_TRANSITION = 'rentaldetailmain'
const RENTAL_STATUS_BADGE_VIEW_TRANSITION = 'rentalstatusbadge'
const HOME_RENTALS_IMAGE_VIEW_TRANSITION = 'home-rentals-featured'

function debugTransitionLog(label: string, payload?: unknown) {
  if (!import.meta.env.DEV) return
  if (payload === undefined) {
    console.log(`[VTDBG] ${label}`)
    return
  }
  if (typeof payload === 'object' && payload !== null) {
    try {
      console.log(`[VTDBG] ${label} ${JSON.stringify(payload)}`)
      return
    } catch {
      // fallback to object logging below
    }
  }
  console.log(`[VTDBG] ${label}`, payload)
}

function getRentalTransitionTargets() {
  if (typeof document === 'undefined') return []
  return Array.from(document.querySelectorAll<HTMLImageElement>('.responsive-image'))
    .filter((image) => getComputedStyle(image).viewTransitionName === RENTAL_IMAGE_VIEW_TRANSITION)
    .map((image) => {
      const rect = image.getBoundingClientRect()
      return {
        className: image.className,
        rect: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      }
    })
}

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

type RentalTransitionState = {
  transitionImage?: {
    src: string
    alt: string
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

function formatRentalCityState(details?: RentalDetails | null) {
  const cityState = [details?.city, details?.state].filter(Boolean).join(', ')
  if (details?.locationLabel && cityState) {
    return `${details.locationLabel} — ${cityState}`
  }
  return details?.locationLabel || cityState || 'Rental property'
}

function RentalImageOverlay({
  title,
  details,
  className,
  viewTransitionName,
}: {
  title: string
  details?: RentalDetails | null
  className?: string
  viewTransitionName?: string
}) {
  return (
    <div
      className={`rental-card-overlay rental-card-overlay-vt${className ? ` ${className}` : ''}`}
      style={viewTransitionName ? { viewTransitionName } : undefined}
    >
      <p className="rental-card-overlay-title">{title}</p>
      <p className="rental-card-overlay-location">{formatRentalCityState(details)}</p>
      <span><strong>Rent:</strong> {formatCurrency(details?.monthlyRent)}</span>
      <span><strong>Beds:</strong> {details?.bedrooms ?? '—'}</span>
      <span><strong>Baths:</strong> {details?.bathrooms ?? '—'}</span>
      <span><strong>Sq Ft:</strong> {details?.squareFeet ?? '—'}</span>
      <span><strong>Available:</strong> {formatAvailableDate(details?.availableDate)}</span>
    </div>
  )
}

function prepareRentalCardTransition(event: MouseEvent<HTMLAnchorElement>) {
  const card = event.currentTarget.closest('article')
  const clickedImage = event.currentTarget.querySelector<HTMLElement>('.responsive-image')
  const clickedOverlay = card?.querySelector<HTMLElement>('.rental-card-overlay-vt')
  const clickedStatusBadge = card?.querySelector<HTMLElement>('.rental-status-badge-vt')
  if (!clickedImage) return

  document.querySelectorAll<HTMLElement>('.responsive-image').forEach((image) => {
    image.style.viewTransitionName = ''
  })
  document.querySelectorAll<HTMLElement>('.rental-card-overlay-vt').forEach((overlay) => {
    overlay.style.viewTransitionName = ''
  })
  document.querySelectorAll<HTMLElement>('.rental-status-badge-vt').forEach((badge) => {
    badge.style.viewTransitionName = ''
  })

  clickedImage.style.viewTransitionName = RENTAL_IMAGE_VIEW_TRANSITION
  if (clickedOverlay) {
    clickedOverlay.style.viewTransitionName = RENTAL_DETAIL_MAIN_VIEW_TRANSITION
  }
  if (clickedStatusBadge) {
    clickedStatusBadge.style.viewTransitionName = RENTAL_STATUS_BADGE_VIEW_TRANSITION
  }
  const rect = clickedImage.getBoundingClientRect()
  debugTransitionLog('clicked image transition target set', {
    href: event.currentTarget.getAttribute('href'),
    rect: {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    computedName: getComputedStyle(clickedImage).viewTransitionName,
    overlayComputedName: clickedOverlay ? getComputedStyle(clickedOverlay).viewTransitionName : '',
    statusComputedName: clickedStatusBadge
      ? getComputedStyle(clickedStatusBadge).viewTransitionName
      : '',
  })
}

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey
}

function navigateWithViewTransition(
  navigate: NavigateFunction,
  to: string,
  state: RentalTransitionState,
) {
  markRouteTransitionStart(to)
  const go = () => {
    flushSync(() => {
      navigate(to, { state, flushSync: true })
    })
  }

  const docWithViewTransition = document as Document & {
    startViewTransition?: (updateCallback: () => void) => {
      ready: Promise<unknown>
      finished: Promise<unknown>
      updateCallbackDone?: Promise<unknown>
    }
  }

  if (typeof docWithViewTransition.startViewTransition === 'function') {
    debugTransitionLog('before startViewTransition', {
      to,
      scrollY: window.scrollY,
      targets: getRentalTransitionTargets(),
    })
    const transition = docWithViewTransition.startViewTransition(() => {
      go()
    })
    void transition.updateCallbackDone
      ?.then(() => {
        debugTransitionLog('update callback done', {
          to,
          scrollY: window.scrollY,
          targets: getRentalTransitionTargets(),
        })
      })
      .catch((error) => {
        debugTransitionLog('update callback rejected', error)
      })
    void transition.ready
      ?.then(() => {
        debugTransitionLog('transition.ready', {
          to,
          scrollY: window.scrollY,
          targets: getRentalTransitionTargets(),
        })
      })
      .catch((error) => {
        debugTransitionLog('transition.ready rejected', error)
      })
    void transition.finished
      ?.then(() => {
        markRouteTransitionEnd(to, 'view-transition')
      })
      .catch((error) => {
        debugTransitionLog('transition.finished rejected', error)
      })
    return
  }

  debugTransitionLog('fallback navigate without View Transition API', { to })
  go()
  requestAnimationFrame(() => {
    markRouteTransitionEnd(to, 'fallback')
  })
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

          <ul className="stack debug-pages-list">
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
                    <div className="debug-pages-list-thumb-wrap">
                      <img
                        src={page.featuredImage.node.sourceUrl}
                        alt={page.featuredImage.node.altText || ''}
                        className="responsive-image debug-pages-list-thumb"
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

function WpPageView({ uri, showFeaturedRentals = false }: { uri: string; showFeaturedRentals?: boolean }) {
  const navigate = useNavigate()
  const { loading, error, data } = useQuery<GetPageByUriData, GetPageByUriVars>(GET_PAGE_BY_URI, {
    variables: { uri },
  })
  const {
    loading: rentalsLoading,
    error: rentalsError,
    data: rentalsData,
  } = useQuery<GetRentalsData>(GET_RENTALS, {
    skip: !showFeaturedRentals,
  })

  function handleRentalImageLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) return
    if (event.currentTarget.target && event.currentTarget.target !== '_self') return

    event.preventDefault()
    prepareRentalCardTransition(event)
    debugTransitionLog('before link navigation', {
      href: event.currentTarget.getAttribute('href'),
      scrollY: window.scrollY,
      targets: getRentalTransitionTargets(),
    })
    const to = event.currentTarget.getAttribute('href')
    if (!to) return
    const image = event.currentTarget.querySelector<HTMLImageElement>('.responsive-image')
    navigateWithViewTransition(navigate, to, {
      transitionImage: {
        src: image?.currentSrc || image?.src || '',
        alt: image?.alt || '',
      },
    })
  }

  const featuredImage = data?.page?.featuredImage?.node
  const pageFeaturedTransitionName = showFeaturedRentals
    ? HOME_RENTALS_IMAGE_VIEW_TRANSITION
    : undefined
  const homeRentals = rentalsData?.rentals?.nodes ?? EMPTY_RENTALS
  const featuredRentals = useMemo(() => {
    if (!showFeaturedRentals) return EMPTY_RENTALS

    const getRent = (rental: RentalNode) => rental.rentalDetails?.monthlyRent ?? null
    const getAvailableDateMs = (rental: RentalNode) => {
      const value = rental.rentalDetails?.availableDate
      if (!value) return null
      const ms = new Date(value).getTime()
      return Number.isNaN(ms) ? null : ms
    }

    return [...homeRentals]
      .sort((a, b) => {
        const aAvailable = a.rentalDetails?.isAvailable ?? false
        const bAvailable = b.rentalDetails?.isAvailable ?? false

        if (aAvailable !== bAvailable) return aAvailable ? -1 : 1

        const aDate = getAvailableDateMs(a)
        const bDate = getAvailableDateMs(b)
        if (aDate != null && bDate != null && aDate !== bDate) return aDate - bDate
        if (aDate == null && bDate != null) return 1
        if (aDate != null && bDate == null) return -1

        const aRent = getRent(a)
        const bRent = getRent(b)
        if (aRent == null && bRent == null) return a.title.localeCompare(b.title)
        if (aRent == null) return 1
        if (bRent == null) return -1
        if (aRent !== bRent) return aRent - bRent

        return a.title.localeCompare(b.title)
      })
      .slice(0, FEATURED_RENTALS_LIMIT)
  }, [showFeaturedRentals, homeRentals])

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

          <h1 className="page-title">{data.page.title}</h1>

          {featuredImage?.sourceUrl && (
            <SmartImage
              src={featuredImage.sourceUrl}
              alt={featuredImage.altText || ''}
              className="responsive-image-page"
              viewTransitionName={pageFeaturedTransitionName}
              width={1440}
              height={810}
              sizes="(max-width: 960px) 100vw, 960px"
            />
          )}

          <div dangerouslySetInnerHTML={{ __html: data.page.content ?? '' }} />
        </article>
      )}

      {showFeaturedRentals && !loading && !error && data?.page && (
        <section className="featured-rentals" aria-labelledby="featured-rentals-title">
          <div className="featured-rentals-header">
            <div>
              <h2 id="featured-rentals-title" className="featured-rentals-heading">
                Featured Rentals
              </h2>
            </div>

            <Link to="/homes" viewTransition>
              Browse all houses →
            </Link>
          </div>

          {rentalsLoading && (
            <LoadingState title="Loading featured rentals" message="Fetching current listings…" />
          )}

          {rentalsError && (
            <ErrorState
              title="Featured rentals unavailable"
              message={`GraphQL error: ${rentalsError.message}`}
            />
          )}

          {!rentalsLoading && !rentalsError && featuredRentals.length === 0 && (
            <EmptyState
              title="No featured rentals yet"
              message="Add published rentals in WordPress to populate this section."
            />
          )}

          {!rentalsLoading && !rentalsError && featuredRentals.length > 0 && (
            <div className="featured-rentals-grid">
              {featuredRentals.map((rental) => {
                const details = rental.rentalDetails
                const image = rental.featuredImage?.node
                const available = details?.isAvailable ?? false
                return (
                  <article key={rental.id} className="card">
                    <div className="rental-media">
                      <Link
                        className="rental-image-link"
                        to={`/homes/${rental.slug}`}
                        onClick={handleRentalImageLinkClick}
                        state={{
                          transitionImage: {
                            src: image?.sourceUrl ?? '',
                            alt: image?.altText || rental.title,
                          },
                        }}
                      >
                        {image?.sourceUrl && (
                          <SmartImage
                            src={image.sourceUrl}
                            alt={image.altText || rental.title}
                            className="responsive-image-card featured-rentals-image"
                            showPlaceholder={false}
                            width={1200}
                            height={900}
                            sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 320px"
                          />
                        )}
                      </Link>
                      <span
                        className={`featured-rentals-badge rental-status-badge rental-status-badge-vt ${available ? 'is-available' : 'is-unavailable'}`}
                      >
                        {available ? 'Available' : 'Unavailable'}
                      </span>
                      <RentalImageOverlay title={rental.title} details={details} />
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}
    </SiteLayout>
  )
}

function RentalsPage() {
  const navigate = useNavigate()
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
    title: 'Houses | Tree City Rentals',
    description: 'Browse current house listings, pricing, bedrooms, bathrooms, and availability.',
  })

  function handleRentalImageLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) return
    if (event.currentTarget.target && event.currentTarget.target !== '_self') return

    event.preventDefault()
    prepareRentalCardTransition(event)
    debugTransitionLog('before link navigation', {
      href: event.currentTarget.getAttribute('href'),
      scrollY: window.scrollY,
      targets: getRentalTransitionTargets(),
    })
    const to = event.currentTarget.getAttribute('href')
    if (!to) return
    const image = event.currentTarget.querySelector<HTMLImageElement>('.responsive-image')
    navigateWithViewTransition(navigate, to, {
      transitionImage: {
        src: image?.currentSrc || image?.src || '',
        alt: image?.alt || '',
      },
    })
  }

  const availabilityParam = searchParams.get('availability')
  const sortParam = searchParams.get('sort')
  const queryParam = searchParams.get('q') ?? ''
  const deferredQueryParam = useDeferredValue(queryParam)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const filterInteractionStartRef = useRef<number | null>(null)

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
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)
  const hasActiveFilters =
    Boolean(queryParam) || availabilityFilter !== 'all' || sortBy !== 'available-first'

  const rentals = data?.rentals?.nodes ?? EMPTY_RENTALS

  useEffect(() => {
    if (!isFiltersVisible) return
    searchInputRef.current?.focus()
  }, [isFiltersVisible])

  function updateSearchParam(key: string, value: string) {
    if (import.meta.env.DEV) {
      filterInteractionStartRef.current = performance.now()
    }

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

  function clearFilters() {
    if (import.meta.env.DEV) {
      filterInteractionStartRef.current = performance.now()
    }
    setSearchParams({})
  }

  const filteredAndSortedRentals = useMemo(() => {
    const normalizedQuery = deferredQueryParam.trim().toLowerCase()

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

    const sorted = [...filtered].sort((a, b) => {
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

    return sorted
  }, [rentals, availabilityFilter, sortBy, deferredQueryParam])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (filterInteractionStartRef.current == null) return

    const durationMs = performance.now() - filterInteractionStartRef.current
    console.log(
      `[PERF] rentals filter response: ${durationMs.toFixed(2)}ms (${filteredAndSortedRentals.length} shown / ${rentals.length} total)`,
    )
    filterInteractionStartRef.current = null
  }, [filteredAndSortedRentals.length, rentals.length])

  return (
    <SiteLayout>
      <h1 className="page-title">Houses</h1>

      <button
        type="button"
        className="rentals-filters-toggle"
        aria-expanded={isFiltersVisible}
        aria-controls="rentals-filters-card"
        onClick={() => setIsFiltersVisible((prev) => !prev)}
      >
        {isFiltersVisible ? 'Hide search' : 'Search houses'}
      </button>

      {isFiltersVisible && (
        <div id="rentals-filters-card" className="card rentals-filters">
          <div className="rentals-filters-fields">
            <label className="form-field">
              <span>Search</span>
              <input
                ref={searchInputRef}
                type="search"
                value={queryParam}
                placeholder="Search title, city, state, neighborhood..."
                onChange={(e) => updateSearchParam('q', e.target.value)}
              />
            </label>

            <div className="rentals-filters-controls">
              <label className="form-field">
                <span>Availability</span>
                <select
                  value={availabilityFilter}
                  onChange={(e) => updateSearchParam('availability', e.target.value)}
                >
                  <option value="all">All houses</option>
                  <option value="available">Available only</option>
                  <option value="unavailable">Unavailable only</option>
                </select>
              </label>

              <label className="form-field">
                <span>Sort by</span>
                <select value={sortBy} onChange={(e) => updateSearchParam('sort', e.target.value)}>
                  <option value="available-first">Available first</option>
                  <option value="rent-asc">Rent: low to high</option>
                  <option value="rent-desc">Rent: high to low</option>
                  <option value="beds-desc">Bedrooms: high to low</option>
                  <option value="available-date-asc">Soonest available date</option>
                </select>
              </label>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rentals-filters-clear"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {!loading && !error && (
            <p className="page-subtle rentals-filters-count" aria-live="polite">
              Showing {filteredAndSortedRentals.length} of {rentals.length} houses
            </p>
          )}
        </div>
      )}

      {loading && (
        <LoadingState title="Loading houses" message="Fetching current listings…" />
      )}

      {error && (
        <ErrorState
          title="Houses failed to load"
          message={`GraphQL error: ${error.message}`}
        />
      )}

      {!loading && !error && rentals.length === 0 && (
        <EmptyState
          title="No houses yet"
          message="Add a few listings in WordPress → Rentals to populate this page."
        />
      )}

      {!loading && !error && rentals.length > 0 && filteredAndSortedRentals.length === 0 && (
        <EmptyState
          title="No matches"
          message="No houses match the current filters/search."
        />
      )}

      <div className="stack rentals-stack" aria-busy={loading}>
        {filteredAndSortedRentals.map((rental, index) => {
          const details = rental.rentalDetails
          const image = rental.featuredImage?.node

          return (
            <article key={rental.id} className="card">
              {image?.sourceUrl && (
                <div className="rental-media">
                  <Link
                    className="rental-image-link"
                    to={`/homes/${rental.slug}`}
                    onClick={handleRentalImageLinkClick}
                    state={{
                      transitionImage: {
                        src: image.sourceUrl,
                        alt: image.altText || rental.title,
                      },
                    }}
                  >
                    <SmartImage
                      src={image.sourceUrl}
                      alt={image.altText || rental.title}
                      className="responsive-image-card"
                      viewTransitionName={index === 0 ? HOME_RENTALS_IMAGE_VIEW_TRANSITION : undefined}
                      showPlaceholder={false}
                      width={1200}
                      height={900}
                      sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 320px"
                    />
                  </Link>
                  <RentalImageOverlay title={rental.title} details={details} />
                </div>
              )}


              {/*
              <div>
                <h2 className="rentals-card-title">
                  <Link to={`/homes/${rental.slug}`} viewTransition>
                    {rental.title}
                  </Link>
                </h2>
                <p className="rentals-card-location">
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
                  <strong>Status:</strong> {details?.isAvailable ? 'Available' : 'Not currently available'}
                </span>
              </div>
              */}

              

              {rental.excerpt && <div dangerouslySetInnerHTML={{ __html: rental.excerpt }} />}

              <div>
                <Link to={`/homes/${rental.slug}`} viewTransition>
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
  const location = useLocation()
  const transitionState = location.state as RentalTransitionState | null
  const transitionImage = transitionState?.transitionImage
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

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [slug])

  return (
    <SiteLayout>
      {loading && !rental && transitionImage?.src && (
        <SmartImage
          src={transitionImage.src}
          alt={transitionImage.alt}
          className="responsive-image-detail"
          viewTransitionName={RENTAL_IMAGE_VIEW_TRANSITION}
          showPlaceholder={false}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          width={1440}
          height={1080}
          sizes="(max-width: 960px) 100vw, 960px"
        />
      )}

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
        <article className="rental-detail-layout">
          <section className={`rental-detail-hero${image?.sourceUrl ? '' : ' is-no-image'}`}>
            {image?.sourceUrl && (
              <SmartImage
                src={image.sourceUrl}
                alt={image.altText || rental.title}
                className="responsive-image-detail rental-detail-hero-image"
                viewTransitionName={RENTAL_IMAGE_VIEW_TRANSITION}
                showPlaceholder={false}
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                width={1440}
                height={1080}
                sizes="(max-width: 960px) 100vw, 960px"
              />
            )}
            <span
              className={`featured-rentals-badge rental-status-badge rental-status-badge-vt ${isAvailable ? 'is-available' : 'is-unavailable'}`}
              style={{ viewTransitionName: RENTAL_STATUS_BADGE_VIEW_TRANSITION }}
            >
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>

            <RentalImageOverlay
              title={rental.title}
              details={details}
              className="rental-detail-main"
              viewTransitionName={RENTAL_DETAIL_MAIN_VIEW_TRANSITION}
            />
          </section>

          {rental.content && (
            <section className="card rental-detail-additional">
              <h2 className="rental-detail-additional-title">Additional Details</h2>
              <div dangerouslySetInnerHTML={{ __html: rental.content }} />
            </section>
          )}
        </article>
      )}
    </SiteLayout>
  )
}

function HomeWpRoute() {
  return <WpPageView uri="/home/" showFeaturedRentals />
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
      {/* Homes routes (must come before generic page slug route) */}
      <Route path="/homes" element={<RentalsPage />} />
      <Route path="/homes/:slug" element={<RentalDetailPage />} />
      <Route path="/contact" element={<ContactPage />} />
      {/* WP Pages by slug */}
      <Route path="/:slug" element={<SlugWpRoute />} />
      {isDev && <Route path="/_debug" element={<DebugPageList />} />}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
