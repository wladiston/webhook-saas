/// <reference types="vitest" />
// eslint-disable-next-line import/no-extraneous-dependencies
import {defineConfig} from 'vite'

// Configure Vitest (https://vitest.dev/config)
export default defineConfig({
  test: {
    /* for example, use global to avoid globals imports (describe, test, expect): */
    // globals: true,
  },
})
