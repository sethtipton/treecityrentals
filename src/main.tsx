import { createRoot } from 'react-dom/client'
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { setupPerformanceLogging } from './performance'

setupPerformanceLogging()

if (import.meta.env.DEV && typeof document !== 'undefined') {
  const docWithDebug = document as Document & {
    __tcrVtPatched?: boolean
    startViewTransition?: (updateCallback: () => void | Promise<void>) => {
      ready: Promise<unknown>
      finished: Promise<unknown>
      updateCallbackDone?: Promise<unknown>
      skipTransition?: () => void
    }
  }

  if (typeof docWithDebug.startViewTransition === 'function' && !docWithDebug.__tcrVtPatched) {
    const originalStartViewTransition = docWithDebug.startViewTransition.bind(document)

    docWithDebug.startViewTransition = (updateCallback) => {
      console.log('[VT] start')
      const transition = originalStartViewTransition(updateCallback)

      transition.ready
        .then(() => console.log('[VT] ready'))
        .catch((error) => console.log('[VT] ready rejected', error))

      transition.finished
        .then(() => console.log('[VT] finished'))
        .catch((error) => console.log('[VT] finished rejected', error))

      if (transition.updateCallbackDone) {
        transition.updateCallbackDone
          .then(() => console.log('[VT] update callback done'))
          .catch((error) => console.log('[VT] update callback rejected', error))
      }

      return transition
    }

    docWithDebug.__tcrVtPatched = true
    console.log('[VT] debug patch enabled')
  }

  document.documentElement.classList.add('vt-debug-noise-off')
}

const client = new ApolloClient({
  link: new HttpLink({
    uri: import.meta.env.VITE_WPGRAPHQL_URL,
  }),
  cache: new InMemoryCache(),
})

createRoot(document.getElementById('root')!).render(
  <ApolloProvider client={client}>
    <BrowserRouter unstable_useTransitions={false}>
      <App />
    </BrowserRouter>
  </ApolloProvider>,
)
