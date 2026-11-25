#!/usr/bin/env node
// ---------------------------------------------------------------------------
// mcp-launch — the one command every catalog MCP server runs, as .mcp.json
// gives it: `node scripts/mcp/launch.mjs <name>` (decision 61).
//
// It reads <name>'s entry of .agents/contracts/mcp-servers.json in the
// checkout that holds this file, and ATL_MCP_AREA, a comma list of areas
// (`web`, `mobile`, `web,mobile`, `none`), which a Claude Desktop
// environment sets for every session opened from it:
//   - unset or empty, every server starts, as before areas existed;
//   - a list that does not name the server's area exits 0 at once, starting
//     nothing, and writes one line to stderr naming the server, its area and
//     the list: a client marks that server failed once and goes on, and
//     nothing retries it;
//   - a list that names it sets process.argv to [node, <absolute entry>,
//     ...serverArgs, ...the arguments .mcp.json gives after the name] and
//     imports node_modules/<package>/<entry> in this same process, never
//     spawning another, so a server is still one process. The arguments
//     after the name are what a project adds, as expo-mcp's
//     `--dev-server-url ${EXPO_DEV_SERVER_URL:-http://localhost:8081}`,
//     which .mcp.json expands before the launcher runs.
// A word of ATL_MCP_AREA that is neither web, mobile nor none is named on
// stderr with the valid ones, and the gate decides as it would without it.
// A name the catalog does not hold, or an entry that is not installed,
// exits 1 and names the server and the command to run.
//
// Not covered: a server whose entry starts only when it is the main module
// (`import.meta.main`, `require.main === module`) is imported and does not
// start; no catalog server's entry was checked for that, since the template
// installs none.
//
// Usage (a client runs it, from .mcp.json):
//   node scripts/mcp/launch.mjs <name> [server args...]
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  AREAS,
  entryFileOf,
  MCP_CATALOG_PATH,
  parseCatalog
} from '../mcp-docs.detect.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const LABEL = 'mcp-launch'
export const AREA_VARIABLE = 'ATL_MCP_AREA'
// The owner, 2026-11-25 (translated from Spanish): "Change to pnpm i".
export const INSTALL_COMMAND = 'pnpm install'
const CHECK_COMMAND = 'pnpm verify:mcp-docs'
const AREA_SEPARATOR = ','
// The word that starts no catalog server, besides the areas themselves.
const NO_AREA = 'none'
const KNOWN_AREAS = [...AREAS, NO_AREA]
const EXIT_HELD = 0
const EXIT_FAILED = 1
// process.argv: the node binary, this file, then the server's name.
const NAME_AT = 2

const areasOf = ({ value }) =>
  (value ?? '')
    .split(AREA_SEPARATOR)
    .map((area) => area.trim().toLowerCase())
    .filter((area) => area !== '')

/**
 * Whether a server of `area` starts under ATL_MCP_AREA = `value`: always
 * when the list is unset or empty, else only when it names `area`.
 */
export const startsIn = ({ area, value }) => {
  const areas = areasOf({ value })
  return areas.length === 0 || areas.includes(area)
}

/** The words of ATL_MCP_AREA = `value` that name no area, lower-cased. */
export const unknownAreasOf = ({ value }) =>
  areasOf({ value }).filter((area) => !KNOWN_AREAS.includes(area))

const knownAreasLine = () =>
  `${KNOWN_AREAS.slice(0, -1).join(', ')} and ${KNOWN_AREAS.at(-1)}`

/** The absolute path of a catalog server's entry file under `root`. */
export const entryPathOf = ({ root, server }) =>
  resolve(
    root,
    entryFileOf({ entry: server.entry, packageName: server.packageName })
  )

const readText = ({ path }) => {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

/**
 * Starts the catalog server `name` of `root` in this process, with `extra`
 * after its catalog serverArgs, or says why not. Resolves the exit code of
 * a server it did not start, or undefined once the server's entry is
 * imported, which then owns the process.
 */
export const launch = async ({
  env = process.env,
  extra = [],
  name,
  root = ROOT,
  stderr = (line) => process.stderr.write(`${line}\n`)
}) => {
  const { servers } = parseCatalog({
    text: readText({ path: resolve(root, MCP_CATALOG_PATH) })
  })
  const server = servers.find((one) => one.name === name)
  if (server === undefined) {
    stderr(
      `${LABEL}: ${name ?? 'no name'} is not a server of ` +
        `${MCP_CATALOG_PATH}; run \`${CHECK_COMMAND}\` to see why`
    )
    return EXIT_FAILED
  }
  const value = env[AREA_VARIABLE]
  const unknown = unknownAreasOf({ value })
  if (unknown.length > 0) {
    stderr(
      `${LABEL}: ${AREA_VARIABLE} names the unknown area(s) ` +
        `${unknown.join(', ')}; the areas are ${knownAreasLine()}`
    )
  }
  if (!startsIn({ area: server.area, value })) {
    stderr(
      `${LABEL}: ${server.name} not started: its area is ${server.area}, ` +
        `and ${AREA_VARIABLE} is ${value}`
    )
    return EXIT_HELD
  }
  const entry = entryPathOf({ root, server })
  if (!existsSync(entry)) {
    stderr(
      `${LABEL}: ${server.name} cannot start: ` +
        `${entryFileOf({ entry: server.entry, packageName: server.packageName })} ` +
        `is not installed; run \`${INSTALL_COMMAND}\``
    )
    return EXIT_FAILED
  }
  process.argv = [process.execPath, entry, ...server.serverArgs, ...extra]
  await import(pathToFileURL(entry).href)
  return undefined
}

if (import.meta.main) {
  const code = await launch({
    extra: process.argv.slice(NAME_AT + 1),
    name: process.argv[NAME_AT]
  })
  if (code !== undefined) process.exitCode = code
}
