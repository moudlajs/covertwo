import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/** Every file under a folder, as paths relative to it. */
function filesIn(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)))
}

/**
 * Writes dist/sw.js from src/sw.js with the list of files to save for offline
 * use (the page, every built asset and public/) and a version that changes
 * whenever one of them does. Hand-written instead of vite-plugin-pwa: the
 * worker is ~80 lines, and this keeps it that way with no new dependency.
 */
function serviceWorker(): Plugin {
  return {
    name: 'covertwo-service-worker',
    apply: 'build',
    writeBundle(options, bundle) {
      const outDir = options.dir ?? 'dist'
      const built = Object.keys(bundle).filter((f) => f !== 'index.html' && !f.endsWith('.map'))
      const files = ['./', ...built, ...filesIn('public')].map((f) => (f === './' ? f : `./${f}`))
      const version = createHash('sha256')
        .update(JSON.stringify(files))
        .update(readFileSync(join(outDir, 'index.html')))
        .digest('hex')
        .slice(0, 12)
      const source = readFileSync('src/sw.js', 'utf8')
        .replace('self.__PRECACHE__', JSON.stringify(files))
        .replace('self.__VERSION__', JSON.stringify(version))
      writeFileSync(join(outDir, 'sw.js'), source)
    },
  }
}

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/.
  base: '/covertwo/',
  plugins: [react(), tailwindcss(), serviceWorker()],
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
