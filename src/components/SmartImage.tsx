import { useState } from 'react'

type SmartImageProps = {
  src: string
  alt: string
  className?: string
  viewTransitionName?: string
  showPlaceholder?: boolean
  loading?: 'lazy' | 'eager'
  decoding?: 'sync' | 'async' | 'auto'
  fetchPriority?: 'high' | 'low' | 'auto'
  width?: number
  height?: number
  sizes?: string
}

export default function SmartImage({
  src,
  alt,
  className,
  viewTransitionName,
  showPlaceholder = true,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  width,
  height,
  sizes,
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const transitionStyle = viewTransitionName ? { viewTransitionName } : undefined

  if (failed) {
    return (
      <div
        className={`image-shell ${className ?? ''}`}
        style={transitionStyle}
        aria-label={alt || 'Image unavailable'}
        role="img"
      >
        <div className="image-fallback">Image unavailable</div>
      </div>
    )
  }

  return (
    <div className={`image-shell ${className ?? ''}`}>
      {!loaded && showPlaceholder && <div className="image-placeholder" aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        className="responsive-image"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        width={width}
        height={height}
        sizes={sizes}
        style={transitionStyle}
      />
    </div>
  )
}
