import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/.
  base: '/covertwo/',
  plugins: [react(), tailwindcss()],
  define: {
    // release-please bumps package.json; npm sets this for every npm script.
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? 'dev'),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'worker/**/*.test.ts'],
  },
})
