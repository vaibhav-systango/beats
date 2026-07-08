import { useEffect, useState } from 'react'

/** Derives a temporary object URL for file preview. Caller owns validation logic. */
export function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  return url
}

/** Derives temporary object URLs for a list of files (same order). */
export function useObjectUrls(files: File[]): string[] {
  const [urls, setUrls] = useState<string[]>([])

  useEffect(() => {
    const objectUrls = files.map((file) => URL.createObjectURL(file))
    setUrls(objectUrls)

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

  return urls
}
