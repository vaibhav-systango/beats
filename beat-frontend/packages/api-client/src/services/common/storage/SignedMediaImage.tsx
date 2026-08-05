import type { ImgHTMLAttributes } from 'react'

import { useSignedMediaUrl } from './storage.queries'

export type SignedMediaImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  /** Storage key or absolute/blob/data URL. */
  src: string | null | undefined
}

/**
 * Renders an image from a storage key (via signed URL) or a direct URL.
 */
export function SignedMediaImage({ src, alt = '', className, ...imgProps }: SignedMediaImageProps) {
  const { url, isLoading } = useSignedMediaUrl(src)

  if (!src) return null

  if (!url) {
    if (!isLoading) return null
    return (
      <div
        className={className}
        aria-hidden="true"
        style={{ backgroundColor: 'var(--muted, #e5e5e5)' }}
      />
    )
  }

  return <img src={url} alt={alt} className={className} {...imgProps} />
}
