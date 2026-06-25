import { Button, Card } from '@beat/ui'

export function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md" header={<h1 className="text-xl font-bold">Admin</h1>}>
        <p className="text-sm text-gray-500">Vite app + protected routes example.</p>
        <Button variant="primary" className="mt-4 w-full" disabled>
          Login
        </Button>
      </Card>
    </div>
  )
}
