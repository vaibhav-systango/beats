import { Button, Card } from '@beat/ui'

import { ORGANISER_AUTH_COPY } from '@/constants'

export function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card
        className="w-full max-w-md"
        header={<h1 className="text-xl font-bold">{ORGANISER_AUTH_COPY.TITLE}</h1>}
      >
        <p className="text-sm text-gray-500">{ORGANISER_AUTH_COPY.SUBTITLE}</p>
        <Button variant="primary" className="mt-4 w-full" disabled>
          {ORGANISER_AUTH_COPY.LOGIN_BUTTON}
        </Button>
      </Card>
    </div>
  )
}
