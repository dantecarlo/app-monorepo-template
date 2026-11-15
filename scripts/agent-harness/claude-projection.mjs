// ---------------------------------------------------------------------------
// claude-projection — the Claude Code projection of the neutral sources,
// `.claude/agents/<name>.md`.
//
// Ported from Certifipago's scripts/agent-harness/claude-projection.mjs.
// ---------------------------------------------------------------------------

import { readNeutralAgents } from './neutral-source.mjs'

const FRONTMATTER_DELIMITER = '---\n'

export const CLAUDE_AGENTS_DIRECTORY = '.claude/agents'
export const NEUTRAL_AGENTS_DIRECTORY = '.agents/agents'

// For Claude the projection is identity BY DESIGN: the neutral frontmatter was
// modelled on the shape Claude already consumes, so reshaping it here would
// invent a difference nobody asked for. The mapping work appears in the
// OpenCode, Codex and Copilot adapters, whose formats really do differ. What
// this file buys is that the bytes are DERIVED from a validated source rather
// than hand-maintained.
export const renderClaudeAgent = ({ body, frontmatterText }) =>
  `${FRONTMATTER_DELIMITER}${frontmatterText}${FRONTMATTER_DELIMITER}${body}`

export const renderClaudeProjection = ({ root }) =>
  new Map(
    readNeutralAgents({
      directory: `${root}/${NEUTRAL_AGENTS_DIRECTORY}`
    }).map((source) => [
      `${CLAUDE_AGENTS_DIRECTORY}/${source.name}.md`,
      renderClaudeAgent(source)
    ])
  )
