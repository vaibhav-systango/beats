import { QueryProvider, registerSessionExpiredHandler } from '@beat/api-client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { router } from '@/router'
import { useAuthStore } from '@/store/auth.store'
import './index.css'

registerSessionExpiredHandler(() => {
  useAuthStore.getState().clearAuth()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </StrictMode>
)
