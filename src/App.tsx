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
        excerpt
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

type PageNode = {
  id: string
  title: string
  slug: string
  uri: string
  excerpt?: string | null
  featuredImage?: {
    node?: {
      sourceUrl: string
      altText?: string | null
    } | null
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
      node?: {
        sourceUrl: string
        altText?: string | null
      } | null
    } | null
  } | null
}

type GetPageByUriVars = {
  uri: string
}

function DebugPageList() {
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
      <nav style={{ marginBottom: '1rem' }}>
        <Link to="/" viewTransition>
          ← Home
        </Link>
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
      <Route path="/:slug" element={<SlugWpRoute />} />

      {isDev && <Route path="/_debug" element={<DebugPageList />} />}

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}