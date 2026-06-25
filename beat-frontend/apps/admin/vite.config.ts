import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/admin',
  plugins: [react(), nxViteTsPaths()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3002,
    host: 'localhost',
    strictPort: false,
  },
  preview: {
    port: 3002,
    host: 'localhost',
  },
  build: {
    outDir: '../../dist/apps/admin',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL ?? 'http://localhost:8000'
    ),
  },
})
