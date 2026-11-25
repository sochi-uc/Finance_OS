import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: Vite serves the SPA and proxies /api to the .NET API (same origin from the browser's view).
// Build: output goes into the API's wwwroot, served under a strict CSP (no inline scripts or styles).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: { '/api': { target: 'http://localhost:8787' }, '/healthz': { target: 'http://localhost:8787' } },
  },
  build: {
    outDir: '../server/src/FinanceOs.Api/wwwroot',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 0,
    modulePreload: { polyfill: false },
  },
})
