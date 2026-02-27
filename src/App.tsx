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
    }
  }
`

type PageNode = {
  id: string
  title: string
  slug: string
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
  } | null
}

type GetPageByUriVars = {
  uri: string
}

function HomePage() {
  const { loading, error, data } = useQuery<GetPagesData>(GET_PAGES)

  return (
    <div style={{ padding: '1.5rem', textAlign: 'left' }}>
      <h1>Tree City Rentals (Frontend)</h1>
      <p>WPGraphQL connection test + route links</p>

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
            {data.pages.nodes.map((page: PageNode) => {
              const frontendPath = page.slug === 'home' ? '/' : `/${page.slug}`

              return (
                <li key={page.id}>
                  <Link to={frontendPath} viewTransition>
                    {page.title || '(no title)'}
                  </Link>{' '}
                  — <code>{frontendPath}</code>
                </li>
              )
            })}
          </ul>

          <p style={{ marginTop: '1rem' }}>
            Try clicking between pages — on supported browsers, the route change uses the View Transitions API
            via React Router’s <code>viewTransition</code> prop.
          </p>
        </>
      )}
    </div>
  )
}

function WpPageView({ uri }: { uri: string }) {
  const { loading, error, data } = useQuery<GetPageByUriData, GetPageByUriVars>(GET_PAGE_BY_URI, {
    variables: { uri },
  })

  return (
    <div style={{ padding: '1.5rem', textAlign: 'left' }}>
      <nav style={{ marginBottom: '1rem' }}>
        <Link to="/" viewTransition>
          ← Back to Home
        </Link>
      </nav>

      <p>
        <small>
          Querying WordPress URI: <code>{uri}</code>
        </small>
      </p>

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
          <h1>{data.page.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: data.page.content ?? '' }} />
        </article>
      )}
    </div>
  )
}

function HomeWpRoute() {
  // Map frontend root "/" to your WordPress page with slug "home"
  return <WpPageView uri="/home" />
}

function SlugWpRoute() {
  const { slug } = useParams()
  return <WpPageView uri={`/${slug ?? ''}`} />
}

export default function App() {
  return (
    <Routes>
      {/* frontend root -> WP "Home" page */}
      <Route path="/" element={<HomeWpRoute />} />

      {/* helper route to see page list + test links */}
      <Route path="/_debug" element={<HomePage />} />

      {/* dynamic WP pages by slug, e.g. /tenant-resources */}
      <Route path="/:slug" element={<SlugWpRoute />} />
    </Routes>
  )
}