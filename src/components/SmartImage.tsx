import { useState } from 'react'

type SmartImageProps = {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
}

export default function SmartImage({ src, alt, className, style }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`image-shell ${className ?? ''}`}
        style={style}
        aria-label={alt || 'Image unavailable'}
        role="img"
      >
        <div className="image-fallback">Image unavailable</div>
      </div>
    )
  }

  return (
    <div className={`image-shell ${className ?? ''}`} style={style}>
      {!loaded && <div className="image-placeholder" aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        className={`responsive-image image-fade ${loaded ? 'is-loaded' : ''}`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}