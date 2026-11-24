import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': import.meta.dirname + '/src',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // e2e/ holds the Playwright interface tests (npm run test:e2e).
    exclude: ['node_modules', 'dist', 'e2e'],
  },
})
