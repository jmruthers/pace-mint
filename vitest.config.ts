import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.integration.test.{ts,tsx}',
        'src/main.tsx',
        'src/test/**',
        'src/types/**',
        '**/node_modules/**',
        '**/dist/**',
      ],
      thresholds: {
        'src/utils/**/*.{ts,tsx}': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 90,
        },
        'src/hooks/**/*.{ts,tsx}': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 90,
        },
        'src/lib/**/*.{ts,tsx}': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 62,
        },
        'src/{components,pages}/**/*.{ts,tsx}': {
          lines: 70,
          statements: 70,
          functions: 70,
          branches: 70,
        },
        'src/App.tsx': { lines: 70, statements: 70, functions: 70, branches: 70 },
        'src/AppRoutes.tsx': { lines: 70, statements: 70, functions: 70, branches: 70 },
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
