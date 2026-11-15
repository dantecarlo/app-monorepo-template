#!/usr/bin/env node
// ---------------------------------------------------------------------------
// The neutral agent sources, the Claude projection, the manifest, the writer
// and the read-only checker. The checker judges a COMPLETE tree: a missing
// output, a stray one, a hand-edited one, an uncommitted one and a stale
// manifest are each drift. The scratch trees sit in the OS temp directory
// (scripts/gate/scratch.mjs); the process cases run check.mjs over a scratch
// git repository, so the `git ls-files` listing is the real one.
//
// Usage:
//   node --test scripts/agent-harness/projection-generation.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { withScratchTree } from '../gate/scratch.mjs'
import { gitFreeEnv } from '../git-free-env.mjs'
import { checkProjection } from './check.mjs'
import { renderClaudeProjection } from './claude-projection.mjs'
import { generateProjection } from './generate.mjs'
import { parseNeutralSource } from './neutral-source.mjs'
import {
  compareProjection,
  MANIFEST_PATH,
  untrackedOutputs
} from './projection-manifest.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..')
const CHECK = join(HERE, 'check.mjs')

const SOURCE_PATH = '.agents/agents/scratch-agent.agent.md'
const OUTPUT_PATH = '.claude/agents/scratch-agent.md'
const TEMPORARY_SUFFIX = '.generating'
const EXIT_FAILURE = 1

const SOURCE = [
  '---',
  'name: scratch-agent',
  'description: A scratch agent used only by these tests.',
  'model: sonnet',
  'tools: Read, Grep',
  '---',
  '',
  '# Scratch',
  '',
  'Body text.',
  ''
].join('\n')

const readText = ({ path, root }) =>
  readFileSync(resolve(root, path), 'utf8').replaceAll('\r\n', '\n')

const inScratch = ({ source = SOURCE, use }) =>
  withScratchTree({
    files: { [SOURCE_PATH]: source },
    prefix: 'agent-harness-projection-',
    use
  })

const git = ({ args, root }) =>
  execFileSync('git', args, { cwd: root, env: gitFreeEnv() })

const runCheck = ({ root }) =>
  spawnSync(process.execPath, [CHECK, '--root', root], {
    encoding: 'utf8',
    env: gitFreeEnv()
  })

const sha256 = ({ value }) =>
  createHash('sha256').update(value).digest('hex')

test('a folded description is read as one line, and the body is kept whole', () => {
  const { body, fields } = parseNeutralSource({
    path: SOURCE_PATH,
    text: SOURCE.replace(
      'description: A scratch agent used only by these tests.',
      'description: >\n  A scratch agent\n  used only by these tests.'
    )
  })

  assert.equal(fields.description, 'A scratch agent used only by these tests.')
  assert.equal(body, '\n# Scratch\n\nBody text.\n')
})

test('given the committed neutral sources, rendering twice produces identical bytes', () => {
  const first = renderClaudeProjection({ root: REPO_ROOT })
  const second = renderClaudeProjection({ root: REPO_ROOT })

  assert.ok(first.size > 0, 'the repository renders no agent at all')
  assert.deepEqual([...second.entries()], [...first.entries()])
})

test('given the committed projection, it already equals what the neutral sources render', () => {
  const { changed, extra, missing } = compareProjection({ root: REPO_ROOT })

  assert.deepEqual(
    { changed, extra, missing },
    { changed: [], extra: [], missing: [] },
    'a committed projection drifted from .agents/agents — run ' +
      'pnpm agent-harness:generate'
  )
})

test('the Claude projection is the neutral source, byte for byte', () => {
  inScratch({
    use: ({ root }) => {
      generateProjection({ root })

      assert.equal(readText({ path: OUTPUT_PATH, root }), SOURCE)
    }
  })
})

test('given a generated projection, regenerating it changes nothing', () => {
  inScratch({
    use: ({ root }) => {
      generateProjection({ root })
      const afterFirst = readText({ path: OUTPUT_PATH, root })
      const manifestAfterFirst = readText({ path: MANIFEST_PATH, root })
      const written = generateProjection({ root })

      assert.deepEqual(written, [OUTPUT_PATH, MANIFEST_PATH].sort())
      assert.equal(readText({ path: OUTPUT_PATH, root }), afterFirst)
      assert.equal(readText({ path: MANIFEST_PATH, root }), manifestAfterFirst)
      assert.deepEqual(checkProjection({ root }).failures, [])
      assert.deepEqual(
        readdirSync(join(root, '.claude', 'agents')).filter((entry) =>
          entry.endsWith(TEMPORARY_SUFFIX)
        ),
        [],
        'an atomic write leaves no temporary file behind'
      )
    }
  })
})

test('the manifest records the sha256 of every rendered output', () => {
  inScratch({
    use: ({ root }) => {
      generateProjection({ root })
      const manifest = JSON.parse(readText({ path: MANIFEST_PATH, root }))

      assert.deepEqual(manifest, {
        generatedBy: 'scripts/agent-harness/generate.mjs',
        outputs: { [OUTPUT_PATH]: sha256({ value: SOURCE }) }
      })
    }
  })
})

test('given a deleted output, the checker reports it missing instead of passing', () => {
  inScratch({
    use: ({ root }) => {
      generateProjection({ root })
      rmSync(resolve(root, OUTPUT_PATH))

      assert.deepEqual(checkProjection({ root }).failures, [
        `missing: ${OUTPUT_PATH}`
      ])
    }
  })
})

test('given an output nobody generates, the checker reports it extra', () => {
  inScratch({
    use: ({ root }) => {
      generateProjection({ root })
      writeFileSync(
        resolve(root, '.claude', 'agents', 'hand-written.md'),
        '---\nname: hand-written\n---\n'
      )

      assert.deepEqual(checkProjection({ root }).failures, [
        'extra: .claude/agents/hand-written.md'
      ])
    }
  })
})

test('given a hand-edited output, the checker reports it changed', () => {
  inScratch({
    use: ({ root }) => {
      generateProjection({ root })
      writeFileSync(resolve(root, OUTPUT_PATH), 'edited by hand\n')

      assert.deepEqual(checkProjection({ root }).failures, [
        `changed: ${OUTPUT_PATH}`
      ])
    }
  })
})

test('given an output checked out with CRLF endings, the checker sees no drift', () => {
  inScratch({
    use: ({ root }) => {
      generateProjection({ root })
      writeFileSync(
        resolve(root, OUTPUT_PATH),
        SOURCE.replaceAll('\n', '\r\n')
      )

      assert.deepEqual(checkProjection({ root }).failures, [])
    }
  })
})

test('given a hand-edited manifest, the checker reports it changed', () => {
  inScratch({
    use: ({ root }) => {
      generateProjection({ root })
      writeFileSync(resolve(root, MANIFEST_PATH), '{}\n')

      assert.deepEqual(checkProjection({ root }).failures, [
        `changed: ${MANIFEST_PATH}`
      ])
    }
  })
})

test('given no manifest, the checker reports it missing', () => {
  inScratch({
    use: ({ root }) => {
      generateProjection({ root })
      rmSync(resolve(root, MANIFEST_PATH))

      assert.deepEqual(checkProjection({ root }).failures, [
        `missing: ${MANIFEST_PATH}`
      ])
    }
  })
})

test('given a source carrying a field outside the closed schema, generation fails and writes nothing', () => {
  inScratch({
    source: SOURCE.replace(
      'model: sonnet',
      'model: sonnet\nsandbox: read-only'
    ),
    use: ({ root }) => {
      assert.throws(
        () => generateProjection({ root }),
        /adapter=claude field=sandbox/,
        'an unmapped field must name itself and the adapter'
      )
      assert.throws(
        () => readText({ path: OUTPUT_PATH, root }),
        /ENOENT/,
        'a rejected source must leave no partial projection behind'
      )
    }
  })
})

test('given a source missing a required field, generation fails and writes nothing', () => {
  inScratch({
    source: SOURCE.replace('tools: Read, Grep\n', ''),
    use: ({ root }) => {
      assert.throws(
        () => generateProjection({ root }),
        /adapter=claude field=tools/
      )
      assert.throws(() => readText({ path: OUTPUT_PATH, root }), /ENOENT/)
    }
  })
})

test('given a source whose declared name disagrees with its filename, generation fails', () => {
  inScratch({
    source: SOURCE.replace('name: scratch-agent', 'name: other-agent'),
    use: ({ root }) => {
      assert.throws(() => generateProjection({ root }), /is filed as/)
      assert.throws(() => readText({ path: OUTPUT_PATH, root }), /ENOENT/)
    }
  })
})

test('given a rendered output that is not committed, the checker names it', () => {
  const rendered = new Map([
    ['.codex/config.toml', 'generated'],
    ['.claude/agents/scratch.md', 'generated']
  ])

  assert.deepEqual(
    untrackedOutputs({
      rendered,
      tracked: ['.claude/agents/scratch.md', 'README.md']
    }),
    ['.codex/config.toml'],
    'an output present on disk but absent from the index is missing from ' +
      'every fresh clone, and no filesystem check can see that'
  )
})

test('given every output committed, the tracking check stays quiet', () => {
  assert.deepEqual(
    untrackedOutputs({
      rendered: new Map([['a.md', 'x']]),
      tracked: ['a.md']
    }),
    []
  )
})

test('projection-check run over a repository whose output git does not list exits 1 and names it', () => {
  inScratch({
    use: ({ root }) => {
      generateProjection({ root })
      git({ args: ['init', '-q'], root })
      git({ args: ['add', '--', SOURCE_PATH, MANIFEST_PATH], root })
      const result = runCheck({ root })

      assert.equal(result.status, EXIT_FAILURE, result.stdout)
      assert.match(result.stderr, /1 deviation\(s\) across 1 projected output/)
      assert.match(
        result.stderr,
        new RegExp(`untracked: ${OUTPUT_PATH.replaceAll('.', '\\.')}`)
      )
      assert.match(result.stderr, /Run pnpm agent-harness:generate/)
    }
  })
})

test('projection-check run over a repository with every output added exits 0', () => {
  inScratch({
    use: ({ root }) => {
      generateProjection({ root })
      git({ args: ['init', '-q'], root })
      git({ args: ['add', '--all'], root })
      const result = runCheck({ root })

      assert.equal(result.status, 0, result.stderr)
      assert.match(
        result.stdout,
        /1 projected output\(s\) match their neutral sources/
      )
    }
  })
})

test('projection-check run over a hand-edited output exits 1 and says how to fix it', () => {
  inScratch({
    use: ({ root }) => {
      generateProjection({ root })
      git({ args: ['init', '-q'], root })
      git({ args: ['add', '--all'], root })
      writeFileSync(resolve(root, OUTPUT_PATH), 'edited by hand\n')
      const result = runCheck({ root })

      assert.equal(result.status, EXIT_FAILURE, result.stdout)
      assert.match(result.stderr, /changed: \.claude\/agents\/scratch-agent\.md/)
      assert.match(result.stderr, /Run pnpm agent-harness:generate/)
    }
  })
})
