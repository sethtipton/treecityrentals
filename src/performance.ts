type MetricPayload = {
  name: string
  value: number
  unit?: 'ms' | 'score'
  detail?: Record<string, unknown>
}

const ROUTE_MARK_PREFIX = 'tcr:route'

function isBrowserRuntime() {
  return typeof window !== 'undefined' && typeof performance !== 'undefined'
}

function inDevMode() {
  return import.meta.env.DEV
}

function logMetric({ name, value, unit = 'ms', detail }: MetricPayload) {
  if (!inDevMode()) return
  const rounded = unit === 'score' ? Number(value.toFixed(4)) : Number(value.toFixed(2))
  if (detail) {
    console.log(`[PERF] ${name}: ${rounded}${unit === 'ms' ? 'ms' : ''}`, detail)
    return
  }
  console.log(`[PERF] ${name}: ${rounded}${unit === 'ms' ? 'ms' : ''}`)
}

function observePaintEntries() {
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType !== 'paint') return
        logMetric({ name: entry.name, value: entry.startTime })
      })
    })
    observer.observe({ type: 'paint', buffered: true })
  } catch {
    // Browser does not support this observer.
  }
}

function observeLcp() {
  try {
    let lcpValue = 0
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        lcpValue = entry.startTime
      })
    })
    observer.observe({ type: 'largest-contentful-paint', buffered: true })

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState !== 'hidden' || lcpValue === 0) return
        logMetric({ name: 'largest-contentful-paint', value: lcpValue })
      },
      { once: true },
    )
  } catch {
    // Browser does not support this observer.
  }
}

function observeCls() {
  try {
    let cls = 0
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const layoutShift = entry as PerformanceEntry & {
          value?: number
          hadRecentInput?: boolean
        }
        if (layoutShift.hadRecentInput) return
        cls += layoutShift.value ?? 0
      })
    })
    observer.observe({ type: 'layout-shift', buffered: true })

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState !== 'hidden') return
        logMetric({ name: 'cumulative-layout-shift', value: cls, unit: 'score' })
      },
      { once: true },
    )
  } catch {
    // Browser does not support this observer.
  }
}

function observeLongTasks() {
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        logMetric({
          name: 'long-task',
          value: entry.duration,
          detail: { startTime: Number(entry.startTime.toFixed(2)) },
        })
      })
    })
    observer.observe({ type: 'longtask', buffered: true })
  } catch {
    // Browser does not support this observer.
  }
}

export function setupPerformanceLogging() {
  if (!isBrowserRuntime()) return

  observePaintEntries()
  observeLcp()
  observeCls()
  observeLongTasks()

  window.addEventListener(
    'load',
    () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      if (!navigation) return

      logMetric({ name: 'dom-content-loaded', value: navigation.domContentLoadedEventEnd })
      logMetric({ name: 'window-load', value: navigation.loadEventEnd })
      logMetric({ name: 'ttfb', value: navigation.responseStart })
    },
    { once: true },
  )
}

export function markRouteTransitionStart(to: string) {
  if (!isBrowserRuntime() || !inDevMode()) return
  performance.mark(`${ROUTE_MARK_PREFIX}:${to}:start`)
}

export function markRouteTransitionEnd(to: string, mode: 'view-transition' | 'fallback') {
  if (!isBrowserRuntime() || !inDevMode()) return

  const startMark = `${ROUTE_MARK_PREFIX}:${to}:start`
  const endMark = `${ROUTE_MARK_PREFIX}:${to}:end`
  const measureName = `route-transition:${mode}:${to}`

  performance.mark(endMark)
  performance.measure(measureName, startMark, endMark)
  const measured = performance.getEntriesByName(measureName).at(-1)

  if (measured) {
    logMetric({
      name: measureName,
      value: measured.duration,
      detail: { mode },
    })
  }

  performance.clearMarks(startMark)
  performance.clearMarks(endMark)
  performance.clearMeasures(measureName)
}
