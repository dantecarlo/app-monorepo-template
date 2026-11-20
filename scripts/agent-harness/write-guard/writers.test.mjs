#!/usr/bin/env node
// ---------------------------------------------------------------------------
// writers — the files each file command writes, read from its arguments:
// the targets of cp, mv, rm, tee, sed -i, perl -i, tar, curl, wget and the
// rest, and the commands a surface agent is held to. The commands are those
// of Certifipago's enforce-agent-writes test.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/writers.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { literal } from './expansion.mjs'
import { SAFE } from './scan.mjs'
import { FILE_WRITERS, SURFACE_WRITERS } from './writers.mjs'

const SCRATCH = 'C:\\Users\\me\\AppData\\Local\\Temp'
const STATE = {
  cwd: 'c:/work/repo',
  host: { scratchRoots: [SCRATCH] },
  vars: new Map()
}

// The targets `command` writes, by the writer its first word names.
const targetsOf = ({ command }) => {
  const [name, ...rest] = command.split(' ')
  return FILE_WRITERS[name]({
    args: rest.map((text) => literal({ text })),
    state: STATE
  }).map(({ text }) => text)
}

for (const [command, targets] of [
  ['cp /tmp/a.ts src/a.ts', ['src/a.ts']],
  // A file written into a folder is judged by the name it gets there.
  ['cp -t out a b', ['out/a', 'out/b']],
  ['cp src/a.ts /tmp/probe/', ['/tmp/probe/a.ts']],
  ['cp a b c', ['c/a', 'c/b']],
  ['cp /tmp/AGENTS.md .', ['./AGENTS.md']],
  ['cp -rt out src/x/', ['out/x']],
  ['mv src/a.ts /tmp/a.ts', ['src/a.ts', '/tmp/a.ts']],
  ['mv -t out a', ['a', 'out/a']],
  ['mv /tmp/x/AGENTS.md .', ['/tmp/x/AGENTS.md', './AGENTS.md']],
  ['install -t . /tmp/AGENTS.md', ['./AGENTS.md']],
  ['rm -rf dist out', ['dist', 'out']],
  ['rmdir build', ['build']],
  ['unlink a', ['a']],
  ['mkdir -p out/x', ['out/x']],
  ['mkdir -m 700 x', ['x']],
  ['touch -d 2020 src/new.ts', ['src/new.ts']],
  ['tee -a hits.txt', ['hits.txt']],
  ['ln -s /tmp/a src/link', ['src/link']],
  ['ln -s /tmp/a', ['.']],
  ['chmod +x scripts/x.sh', ['scripts/x.sh']],
  ['chown me a b', ['a', 'b']],
  ['truncate -s 0 app.log', ['app.log']],
  ['install -m 644 /tmp/a lib/a', ['lib/a']],
  ['install -d a b', ['a', 'b']],
  ['sd old new src/a.ts', ['src/a.ts']],
  ['sd -p old new src/a.ts', []],
  ['sed -i s/a/b/ src/a.ts', ['src/a.ts']],
  ['sed -i -e s/a/b/ src/a.ts', ['src/a.ts']],
  ['sed --in-place --expression=s/a/b/ src/a.ts', ['src/a.ts']],
  ['sed s/a/b/ src/a.ts', []],
  ['perl -pi -e s/a/b/ src/a.ts', ['src/a.ts']],
  ['perl -0777 -pi -e s/a/b/ apps/x.ts', ['apps/x.ts']],
  ['perl -0pi -e s/a/b/ apps/x.ts', ['apps/x.ts']],
  ['perl -pi.bak -e s/a/b/ apps/x.ts', ['apps/x.ts']],
  ['perl -i -pe s/a/b/ apps/x.ts', ['apps/x.ts']],
  ['perl -lpi -e s/a/b/ apps/x.ts', ['apps/x.ts']],
  ['perl -0777 -ne print apps/x.ts', []],
  ['perl -MJSON -e print apps/x.json', []],
  ['tar -x', ['.']],
  ['tar -xf x.tar AGENTS.md', ['./AGENTS.md']],
  ['tar xzf x.tgz a b', ['./a', './b']],
  ['tar -xf x.tar -C d m', ['d/m']],
  ['unzip -o x.zip AGENTS.md', ['./AGENTS.md']],
  ['unzip x.zip m -d d', ['d/m']],
  ['unzip x.zip -x m', ['.']],
  ['unzip -qd .claude x.zip', ['.claude']],
  ['tar -x -C /tmp/tree', ['/tmp/tree']],
  ['tar -xzf /tmp/a.tgz -C apps', ['apps']],
  ['tar xzf a.tgz', ['.']],
  ['tar czf out.tgz src', ['out.tgz']],
  ['tar -cf - src', []],
  ['tar -tzf a.tgz', []],
  ['unzip bundle.zip', ['.']],
  ['unzip -d /tmp/b bundle.zip', ['/tmp/b']],
  ['unzip -l bundle.zip', []],
  ['curl -sS -o out.json https://example.test/a', ['out.json']],
  ['curl --output=out.json https://example.test/a', ['out.json']],
  ['curl -sSLO https://example.test/a', ['./a']],
  ['curl -O https://e.test/x/AGENTS.md?raw=1', ['./AGENTS.md']],
  ['curl --output-dir d -O https://e.test/a.md', ['d/a.md']],
  ['curl -sSo out.json https://e.test/a', ['out.json']],
  ['curl -fsSLo out.json https://e.test/a', ['out.json']],
  ['curl -s http://localhost:8081/status', []],
  ['curl -o - https://example.test/a', []],
  ['wget https://example.test/a', ['./a']],
  ['wget https://example.test/', ['./index.html']],
  ['wget -qO out.json https://e.test/a', ['out.json']],
  ['wget -O a.html https://example.test/a', ['a.html']],
  ['wget -P dl -o log.txt https://example.test/a', ['log.txt', 'dl/a']],
  ['wget --spider https://example.test/a', []],
  ['dd if=/tmp/a of=apps/x', ['apps/x']],
  ['sort -o apps/x /tmp/a', ['apps/x']],
  ['sort /tmp/a', []],
  ['sort -ro out.txt in.txt', ['out.txt']],
  ['uniq a b', ['b']],
  ['gzip a.log', ['a.log']],
  ['gzip -c a.log', []],
  ['xz -t a.xz', []],
  ['shred -n 3 a', ['a']],
  ['mkfifo p', ['p']],
  ['rsync -a src/ /tmp/b', ['/tmp/b']],
  ['patch -p1', ['.']],
  ['patch --dry-run -p1', []],
  ['patch AGENTS.md', ['AGENTS.md']],
  ['patch -o out.md a.md p.diff', ['out.md']],
  ['patch -i p.diff a.md', ['a.md']],
  ['dos2unix AGENTS.md b.txt', ['AGENTS.md', 'b.txt']],
  ['dos2unix -n in.txt out.txt', ['out.txt']],
  ['unix2dos AGENTS.md', ['AGENTS.md']],
  ['awk -i inplace {print} AGENTS.md', ['AGENTS.md']],
  ['gawk --include=inplace {print} AGENTS.md', ['AGENTS.md']],
  ['awk -f prog.awk -i inplace AGENTS.md', ['AGENTS.md']],
  ['awk {print} AGENTS.md', []],
  ['vim -c wq AGENTS.md', ['AGENTS.md']],
  ['vi a b', ['a', 'b']],
  ['ex -sc wq AGENTS.md', ['AGENTS.md']],
  ['nvim --headless -c wq AGENTS.md', ['AGENTS.md']],
  ['ed -s AGENTS.md', ['AGENTS.md']],
  ['openssl rand -out AGENTS.md 16', ['AGENTS.md']],
  ['openssl req -keyout k.pem -out c.pem', ['k.pem', 'c.pem']],
  ['iconv -f a -t b -o out.txt in.txt', ['out.txt']],
  ['iconv --output=out.txt in.txt', ['out.txt']],
  ['iconv -f a -t b in.txt', []],
  ['sponge AGENTS.md', ['AGENTS.md']],
  ['sponge -a AGENTS.md', ['AGENTS.md']],
  ['yq -i .a=1 AGENTS.md', ['AGENTS.md']],
  ['yq .a AGENTS.md', []],
  ['scp host:/x AGENTS.md', ['AGENTS.md']],
  ['scp AGENTS.md host:/x', []],
  ['zip -r out.zip docs', ['out.zip']],
  ['gpg -o out.txt -d in.gpg', ['out.txt']],
  ['gpg --output out.txt -d in.gpg', ['out.txt']],
  ['gpg -d in.gpg', []],
  ['rsync -a src/ host:/x', []],
  ['mktemp -d -p .', [`./${SAFE}`]],
  ['mktemp -d', [`${SCRATCH}/${SAFE}`]]
]) {
  test(`a file command names what it writes: ${command}`, () => {
    assert.deepEqual(targetsOf({ command }), targets)
  })
}

test('a surface agent is held to the commands that write its own files', () => {
  assert.deepEqual([...SURFACE_WRITERS].sort(), [
    'cp',
    'ln',
    'mkdir',
    'mv',
    'perl',
    'rm',
    'rmdir',
    'sd',
    'sed',
    'tee',
    'touch',
    'unlink'
  ])
  assert.ok([...SURFACE_WRITERS].every((name) => name in FILE_WRITERS))
})
