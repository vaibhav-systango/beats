const USER_APP_BASE_URL =
  process.env.VITE_USER_APP_URL ?? 'http://localhost:3004'

export function getPublicEventUrl(slug: string): string {
  const base = USER_APP_BASE_URL.replace(/\/$/, '')
  return `${base}/events/${slug}`
}
