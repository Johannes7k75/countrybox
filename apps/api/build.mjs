import { cpSync, readFileSync } from 'node:fs'

// Bundles the API (and workspace packages) into dist/server.mjs; npm deps stay external.
import { build } from 'esbuild'
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const external = Object.keys(pkg.dependencies).filter((d) => !d.startsWith('@countrybox/'))
await build({
  entryPoints: ['src/server.ts', 'src/db/migrate.ts'],
  outdir: 'dist',
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  external,
  sourcemap: true,
  logLevel: 'info',
})
// migrate.mjs resolves ./migrations next to itself
cpSync('src/db/migrations', 'dist/db/migrations', { recursive: true })
