// @ts-check
//
// Shared detection for code-standards §3.1 — "the suffix is the contract".
//
// A view or hook file (*.component.tsx / *.screen.tsx / *.hook.ts) declares
// nothing that a sibling owns by suffix:
//   - a top-level type declaration (interface / type alias / enum) belongs in
//     the block's *.type.ts,
//   - a top-level SCREAMING_SNAKE_CASE const belongs in the block's
//     *.constant.ts.
//
// Helper arrow functions are out of scope. Only module-level declarations
// count: a type or const nested inside a function is private working state,
// not part of what the FILE declares by suffix.

export const BANNED_TYPE_NODE_TYPES = new Set([
  'TSEnumDeclaration',
  'TSInterfaceDeclaration',
  'TSTypeAliasDeclaration'
])

// SCREAMING_SNAKE_CASE. Matches FOO, FOO_BAR, MAX_RETRY_2, _PRIVATE; rejects
// camelCase (useFoo) and PascalCase (MyComponent).
export const SCREAMING_SNAKE_RE = /^_?[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/

// A top-level `export` carries its declaration in `.declaration`; unwrap it so
// `export interface I {}` and a bare `interface I {}` are judged identically.
const unwrapExport = (statement) => {
  if (
    (statement.type === 'ExportNamedDeclaration' ||
      statement.type === 'ExportDefaultDeclaration') &&
    statement.declaration
  ) {
    return statement.declaration
  }
  return statement
}

export const collectTopLevelViolations = (body) => {
  const violations = []

  for (const statement of body) {
    const declaration = unwrapExport(statement)
    if (!declaration || typeof declaration.type !== 'string') continue

    if (BANNED_TYPE_NODE_TYPES.has(declaration.type)) {
      violations.push({ kind: 'type', node: declaration })
      continue
    }

    if (
      declaration.type === 'VariableDeclaration' &&
      declaration.kind === 'const'
    ) {
      for (const declarator of declaration.declarations) {
        const id = declarator.id
        if (
          id &&
          id.type === 'Identifier' &&
          SCREAMING_SNAKE_RE.test(id.name)
        ) {
          violations.push({
            kind: 'const',
            name: id.name,
            node: declarator
          })
        }
      }
    }
  }

  return violations
}
