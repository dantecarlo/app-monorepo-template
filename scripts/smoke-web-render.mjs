import { spawn, spawnSync } from 'node:child_process'

const PORT = 3000
const BASE_URL = `http://localhost:${PORT}`
const MAX_RETRIES = 30
const RETRY_INTERVAL_MS = 1000
const KNOWN_MARKER = 'aurora'
const IS_WINDOWS = process.platform === 'win32'
const START_ARGS = ['--filter', '@app/web', 'start']
const SERVER_STDIO = ['ignore', 'inherit', 'inherit']

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const pollUntilReady = async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(BASE_URL)
      if (res.status === 200) return res
      // non-200 (e.g. 503 during Next.js startup) — keep retrying
    } catch {
      // server not yet accepting connections
    }
    if (attempt < MAX_RETRIES) await sleep(RETRY_INTERVAL_MS)
  }
  throw new Error(`Server at ${BASE_URL} did not respond with HTTP 200 after ${MAX_RETRIES} attempts`)
}

// Windows ships pnpm as `pnpm.cmd`, which only a shell can start; the command is
// one fixed string, so nothing from outside reaches the shell.
const server = IS_WINDOWS
  ? spawn(['pnpm', ...START_ARGS].join(' '), { stdio: SERVER_STDIO, shell: true })
  : spawn('pnpm', START_ARGS, { stdio: SERVER_STDIO, shell: false })

let exitCode = 0

// Killing the shell on Windows would leave `next start` running, so the whole
// process tree goes.
const cleanup = () => {
  if (server.killed || server.exitCode !== null) return
  if (IS_WINDOWS) {
    spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], {
      stdio: 'ignore'
    })
    return
  }
  server.kill('SIGTERM')
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

server.on('error', (err) => {
  console.error('[smoke-web-render] Failed to start server:', err.message)
  process.exit(1)
})

try {
  console.log('[smoke-web-render] Waiting for server to be ready...')
  const res = await pollUntilReady()

  const body = await res.text()
  if (!body.includes(KNOWN_MARKER)) {
    console.error(
      `[smoke-web-render] FAIL: HTTP 200 but expected marker "${KNOWN_MARKER}" not found in response body`
    )
    exitCode = 1
  } else {
    console.log('[smoke-web-render] OK: HTTP 200 and marker present')
  }
} catch (err) {
  console.error(`[smoke-web-render] FAIL: ${err.message}`)
  exitCode = 1
} finally {
  cleanup()
}

process.exit(exitCode)
