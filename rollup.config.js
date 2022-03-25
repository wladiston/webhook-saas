import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import {terser} from 'rollup-plugin-terser'

import pkg from './package.json'

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH

export default [
  {
    input: 'src/index.ts',
    external: ['node-fetch', 'uuid'],
    output: [
      {file: pkg.main, format: 'cjs'},
      {file: pkg.module, format: 'es'},
    ],
    plugins: [
      typescript(),
      resolve(), // tells Rollup how to find date-fns in node_modules
      commonjs(), // converts date-fns to ES modules
      production && terser(), // minify, but only in production
    ],
  },
  {
    // path to your declaration files root
    input: './dist/dts/index.d.ts',
    output: [{file: pkg.types, format: 'es'}],
    plugins: [dts()],
  },
]
