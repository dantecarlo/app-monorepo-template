// ---------------------------------------------------------------------------
// bounded-child — runs one command with a time bound, and at the bound ends
// the child with every process it started.
//
// On Windows a killed parent does not take its children with it: a child
// stopped with `child.kill()`, as Node's own `timeout` option stops it,
// leaves its grandchildren running and holding its pipes. So the bound here
// calls `signalProcessTree` (`@app/tooling/process-tree`), which runs
// `taskkill /T /F` on Windows and signals the child alone on POSIX, where
// the child is spawned without `detached` so that a terminal and a Ctrl-C
// still reach it as they did; then it releases the child's pipes and
// resolves as timed out, whether or not a grandchild still holds them.
// ---------------------------------------------------------------------------

import { spawn as nodeSpawn } from 'node:child_process'

import { signalProcessTree } from '@app/tooling/process-tree'

const STOP_SIGNAL = 'SIGTERM'
const ENCODING = 'utf8'

/**
 * Runs `command` with `args`, its stdout and stderr captured, for at most
 * `timeoutMs` milliseconds. Resolves { code, error, pid, signal, stderr,
 * stdout, timedOut }: `code` is the exit code, or null when the child was
 * stopped at the bound (`timedOut: true`) or never started (`error`).
 * `spawn` and `endTree` are injected by tests.
 */
export const runBounded = ({
  args,
  command,
  cwd,
  endTree = signalProcessTree,
  env,
  spawn = nodeSpawn,
  timeoutMs
}) =>
  new Promise((resolve) => {
    const out = []
    const err = []
    let settled = false
    let timer
    let child
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({
        code: null,
        pid: child?.pid,
        stderr: Buffer.concat(err).toString(ENCODING),
        stdout: Buffer.concat(out).toString(ENCODING),
        timedOut: false,
        ...result
      })
    }
    try {
      child = spawn(command, args, {
        cwd,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
      })
    } catch (error) {
      finish({ error })
      return
    }
    child.stdout.on('data', (chunk) => out.push(Buffer.from(chunk)))
    child.stderr.on('data', (chunk) => err.push(Buffer.from(chunk)))
    child.on('error', (error) => finish({ error }))
    child.on('close', (code, signal) => finish({ code, signal }))
    timer = setTimeout(() => {
      endTree({ child, signal: STOP_SIGNAL, wait: true })
      child.stdout.destroy()
      child.stderr.destroy()
      child.unref?.()
      finish({ timedOut: true })
    }, timeoutMs)
  })
