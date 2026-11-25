// ---------------------------------------------------------------------------
// mcp-check — the MCP part of the SessionStart hook (session-start.mjs).
//
// Every catalog server a project's .mcp.json runs goes through the launcher,
// `node scripts/mcp/launch.mjs <name>`, which imports the server's pinned
// entry, node_modules/<package>/<entry>; until someone installs, a server
// whose entry is missing fails when a client starts it. So a session starts
// by naming them: for every .mcp.json server whose args start with the
// launcher and name a catalog server, this checks that its entry file
// exists, and returns one line naming the missing ones and the install
// command, or null. A server whose area ATL_MCP_AREA holds off is left
// out: the launcher would hold it whether or not it is installed. It reads .mcp.json and the catalog and stats one file
// per server, nothing more, so it ends in milliseconds of the hook's
// budget. With no .mcp.json, as in the template's own checkout, or one it
// cannot read, it says nothing: verify:mcp-docs judges a malformed one.
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  entryFileOf,
  MCP_CATALOG_PATH,
  MCP_CONFIG_PATH,
  parseCatalog,
  parseMcpConfig
} from '../../mcp-docs.detect.mjs'
import {
  AREA_VARIABLE,
  INSTALL_COMMAND,
  startsIn
} from '../../mcp/launch.mjs'

const LABEL = 'mcp-check'

const readText = ({ path }) => {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

/**
 * The names, in .mcp.json's order, of the servers of `root` that run the
 * launcher with a catalog name, that `env`'s ATL_MCP_AREA starts, and
 * whose entry file is not installed.
 */
export const missingServers = ({ env, root }) => {
  const config = parseMcpConfig({
    text: readText({ path: join(root, MCP_CONFIG_PATH) })
  })
  if (config.servers.length === 0) return []
  const catalog = new Map(
    parseCatalog({
      text: readText({ path: join(root, MCP_CATALOG_PATH) })
    }).servers.map((server) => [server.name, server])
  )
  return config.servers
    .filter(({ launches }) => catalog.has(launches))
    .filter(({ launches }) =>
      startsIn({
        area: catalog.get(launches).area,
        value: env[AREA_VARIABLE]
      })
    )
    .filter(({ launches }) => {
      const server = catalog.get(launches)
      return !existsSync(
        join(
          root,
          entryFileOf({
            entry: server.entry,
            packageName: server.packageName
          })
        )
      )
    })
    .map(({ name }) => name)
}

/** The one line a session starts with when servers cannot start, or null. */
export const mcpCheckLine = ({ env = process.env, root }) => {
  const missing = missingServers({ env, root })
  if (missing.length === 0) return null
  return (
    `${LABEL}: ${missing.length} MCP server(s) cannot start, their pinned ` +
    `entry not installed under node_modules: ${missing.join(', ')}; run ` +
    `\`${INSTALL_COMMAND}\``
  )
}
