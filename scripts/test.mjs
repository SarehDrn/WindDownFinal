#!/usr/bin/env node
// One-command test runner for Wind Down (Windows, macOS, Linux).
//
//   node scripts/test.mjs                      # everything
//   node scripts/test.mjs backend-unit         # one or more suites by name
//   node scripts/test.mjs backend-integration frontend
//
// Steps: start the Postgres container (`docker compose up -d --wait db`),
// run backend pytest unit tests, then integration tests, then frontend
// Vitest tests. Exits non-zero if anything fails.
//
// The backend tests get their own environment and never read backend/.env.
// Override the database with TEST_DATABASE_URL if needed.

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const backendDir = path.join(root, 'backend')
const frontendDir = path.join(root, 'frontend')
const isWindows = process.platform === 'win32'
const venvPython = isWindows
  ? path.join(backendDir, '.venv', 'Scripts', 'python.exe')
  : path.join(backendDir, '.venv', 'bin', 'python')

const SUITES = ['backend-unit', 'backend-integration', 'frontend']
const requested = process.argv.slice(2)
const unknown = requested.filter((name) => !SUITES.includes(name))
if (unknown.length) {
  console.error(`Unknown suite(s): ${unknown.join(', ')}. Choose from: ${SUITES.join(', ')}`)
  process.exit(2)
}
const suites = requested.length ? requested : SUITES
const needsBackend = suites.some((s) => s.startsWith('backend'))

const testEnv = {
  ...process.env,
  DJANGO_NO_DOTENV: '1',
  DJANGO_SECRET_KEY: 'test-only-insecure-secret-key',
  DEBUG: '0',
  DATABASE_URL:
    process.env.TEST_DATABASE_URL || 'postgres://winddown:winddown@localhost:5433/winddown',
}

function run(label, command, args, options = {}) {
  console.log(`\n=== ${label} ===`)
  console.log(`> ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    // npm is a .cmd shim on Windows, which needs a shell.
    shell: isWindows && command === 'npm',
    ...options,
  })
  if (result.error) {
    console.error(`${label}: could not start ${command}: ${result.error.message}`)
    return false
  }
  return result.status === 0
}

function ensureBackendVenv() {
  if (existsSync(venvPython)) return true
  const systemPython = isWindows ? 'python' : 'python3'
  return (
    run('Create backend venv', systemPython, ['-m', 'venv', '.venv'], { cwd: backendDir }) &&
    run('Install backend requirements', venvPython, ['-m', 'pip', 'install', '-r', 'requirements.txt'], {
      cwd: backendDir,
    })
  )
}

function ensureFrontendDeps() {
  if (existsSync(path.join(frontendDir, 'node_modules'))) return true
  return run('Install frontend dependencies', 'npm', ['ci'], { cwd: frontendDir })
}

const results = []
function record(name, ok) {
  results.push({ name, ok })
}

if (needsBackend) {
  const dbUp = run('Start Postgres (docker compose db)', 'docker', ['compose', 'up', '-d', '--wait', 'db'], {
    cwd: root,
  })
  const venvOk = dbUp && ensureBackendVenv()
  for (const suite of suites.filter((s) => s.startsWith('backend'))) {
    if (!venvOk) {
      record(suite, false)
      continue
    }
    const marker = suite === 'backend-unit' ? 'not integration' : 'integration'
    record(
      suite,
      run(`Backend ${marker === 'integration' ? 'integration' : 'unit'} tests (pytest -m "${marker}")`, venvPython, ['-m', 'pytest', '-m', marker], {
        cwd: backendDir,
        env: testEnv,
      }),
    )
  }
}

if (suites.includes('frontend')) {
  const depsOk = ensureFrontendDeps()
  record('frontend', depsOk && run('Frontend tests (vitest run)', 'npm', ['test'], { cwd: frontendDir }))
}

console.log('\n=== Summary ===')
for (const { name, ok } of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
const failed = results.some((r) => !r.ok)
console.log(failed ? '\nSome tests FAILED.' : '\nAll tests passed.')
process.exit(failed ? 1 : 0)
