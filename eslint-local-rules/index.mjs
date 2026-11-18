// @ts-check
//
// Local ESLint plugin — turns three previously AI-judged code standards into
// deterministic lint rules. Imported directly by eslint.config.mjs (flat
// config accepts an inline plugin object, so no npm package install is needed).
//
// Rules:
//   no-inline-tailwind-classname  (#9)  — warn: ban string-literal className in
//                                          *.component.tsx / *.screen.tsx;
//                                          Tailwind classes belong in *.style.ts.
//   single-object-params          (#16) — warn: functions take ONE object param;
//                                          allow-lists event handlers, array
//                                          callbacks, reducers, and documented
//                                          third-party callbacks.
//   no-non-ascii-identifier       (#19) — warn: flag non-ASCII identifier names
//                                          (English-everywhere convention).
//
// #9 and #16 are intentionally `warn` (wired in eslint.rules.mjs): both have
// legitimate exceptions in the template's own example code that cannot be
// cleanly excluded by a static selector, and the project contract forbids ever
// leaving the validation gate red. #19 is `warn` by design (medium confidence).

import { findJustifyingPhrase } from './justifying-comment.detect.mjs'
import { SRC_ALIAS, toSrcAlias } from './package-src-alias.detect.mjs'
import { collectTopLevelViolations } from './suffix-contract.detect.mjs'
import { readFileSync } from 'node:fs'
import {
  collectPositioningViolations,
  collectTokenValueViolations,
  isAllowlisted,
  positionsOnlyScope,
  STYLE_ALLOWLIST_FILE,
  STYLE_RULE,
  tokenValuesScope
} from './style-positioning.detect.mjs'
import { isOutsideUiKit, isUiKitSource } from './ui-kit.detect.mjs'
import { fileURLToPath } from 'node:url'
import {
  collectSeamViolations,
  indexRegistry,
  isInScope,
  readSeamInputs,
  toRepoPath
} from './dependency-seam.detect.mjs'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Names whose call site means "this callback's positional params are dictated
// by a third party / language contract", so single-object-params does not apply.
const ARRAY_CALLBACK_METHODS = new Set([
  'every',
  'filter',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'flatMap',
  'forEach',
  'map',
  'reduce',
  'reduceRight',
  'some',
  'sort'
])

// Documented third-party callback hosts (code-standards Rule 5 exceptions:
// TanStack queryFn/onError, MSW handlers, RN Pressable style fn, etc.). When a
// function literal is passed as an argument to a call whose callee name (or
// member property) is in this set, its positional params are allowed.
const THIRD_PARTY_CALLBACK_NAMES = new Set([
  'addEventListener',
  'createServer',
  'forEach',
  'http',
  'https',
  'onError',
  'onSuccess',
  'queryFn',
  'removeEventListener',
  'setInterval',
  'setTimeout',
  'subscribe'
])

// Param names that signal an event-handler / callback contract.
const EVENT_PARAM_RE = /^(_?e|_?ev|_?evt|_?event|_?args?|_?next|_?prev)$/i

// eslint-disable-next-line no-control-regex
const NON_ASCII_RE = /[^\x00-\x7F]/

const getCalleeName = (node) => {
  if (!node) return undefined
  if (node.type === 'Identifier') return node.name
  if (node.type === 'MemberExpression' && node.property) {
    return node.property.name
  }
  return undefined
}

// True when this function literal is an argument to a call we allow-list
// (array callback method OR documented third-party callback host).
const isAllowedCallbackArgument = (node) => {
  const parent = node.parent
  if (!parent || parent.type !== 'CallExpression') return false
  if (!parent.arguments.includes(node)) return false

  const callee = parent.callee
  // Array callback: foo.map(fn) / arr.reduce(fn)
  if (
    callee.type === 'MemberExpression' &&
    callee.property &&
    ARRAY_CALLBACK_METHODS.has(callee.property.name)
  ) {
    return true
  }

  const name = getCalleeName(callee)
  return name !== undefined && THIRD_PARTY_CALLBACK_NAMES.has(name)
}

// True when this is a function literal used directly as a JSX attribute value
// (e.g. onClick={(e, x) => ...}) — DOM/RN event-handler contract.
const isJsxAttributeCallback = (node) => {
  const parent = node.parent
  return (
    parent !== undefined &&
    parent.type === 'JSXExpressionContainer' &&
    parent.parent !== undefined &&
    parent.parent.type === 'JSXAttribute'
  )
}

// True when the FIRST param reads like an event/arg, signalling a handler
// whose signature is dictated by the caller, not by us.
const looksLikeEventHandler = (params) => {
  const first = params[0]
  return (
    first !== undefined &&
    first.type === 'Identifier' &&
    EVENT_PARAM_RE.test(first.name)
  )
}

// ---------------------------------------------------------------------------
// Rule: no-inline-tailwind-classname (#9)
// ---------------------------------------------------------------------------
const noInlineTailwindClassname = {
  meta: {
    docs: {
      description:
        'Disallow string-literal className values in components/screens — Tailwind classes belong in *.style.ts constants.'
    },
    messages: {
      inline:
        'No inline Tailwind className literal — extract the class string into a *.style.ts constant (code-standards: Tailwind-in-constants).'
    },
    schema: [],
    type: 'suggestion'
  },
  create(context) {
    const report = (node) => context.report({ messageId: 'inline', node })

    return {
      JSXAttribute(node) {
        if (!node.name || node.name.name !== 'className') return
        const value = node.value
        if (!value) return

        // className="literal string"
        if (value.type === 'Literal' && typeof value.value === 'string') {
          report(value)
          return
        }

        if (value.type !== 'JSXExpressionContainer') return
        const expr = value.expression

        // className={'literal'} or className={`static template`} (no
        // interpolation). Templates WITH interpolation usually compose
        // *.style constants, so they are left alone.
        if (expr.type === 'Literal' && typeof expr.value === 'string') {
          report(expr)
          return
        }
        if (
          expr.type === 'TemplateLiteral' &&
          expr.expressions.length === 0
        ) {
          report(expr)
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Rule: single-object-params (#16)
// ---------------------------------------------------------------------------
const singleObjectParams = {
  meta: {
    docs: {
      description:
        'Functions take a single destructured object parameter — no positional argument lists (code-standards Rule 5).'
    },
    messages: {
      positional:
        'Use a single destructured object parameter instead of {{count}} positional params (code-standards Rule 5). Allowed exceptions: event handlers, array callbacks, reducers, documented third-party callbacks.'
    },
    schema: [],
    type: 'suggestion'
  },
  create(context) {
    const check = (node) => {
      const params = node.params
      if (params.length <= 1) return

      // Rest params (...args) are a single variadic contract — allow.
      if (params.some((p) => p.type === 'RestElement')) return

      // Allow-listed contexts where the signature is dictated externally.
      if (isJsxAttributeCallback(node)) return
      if (isAllowedCallbackArgument(node)) return
      if (looksLikeEventHandler(params)) return

      context.report({
        data: { count: String(params.length) },
        messageId: 'positional',
        node
      })
    }

    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check
    }
  }
}

// ---------------------------------------------------------------------------
// Rule: no-non-ascii-identifier (#19)
// ---------------------------------------------------------------------------
const noNonAsciiIdentifier = {
  meta: {
    docs: {
      description:
        'Identifiers must use ASCII characters only (English-everywhere convention).'
    },
    messages: {
      nonAscii:
        'Identifier "{{name}}" contains non-ASCII characters — use English ASCII identifiers (code-standards: English everywhere).'
    },
    schema: [],
    type: 'suggestion'
  },
  create(context) {
    return {
      Identifier(node) {
        if (NON_ASCII_RE.test(node.name)) {
          context.report({
            data: { name: node.name },
            messageId: 'nonAscii',
            node
          })
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Rule: logic-in-view + single-use-state (logic-in-hook enforcement)
// ---------------------------------------------------------------------------
//
// A use{Name}.hook.ts is REQUIRED when a *.component.tsx / *.screen.tsx holds
// LOGIC. no-restricted-syntax selectors already ban useEffect/useMemo/
// useCallback/useRef and inline fetch/async in views, but selectors CANNOT
// count occurrences or measure a function body's statement length. These two
// rules cover the parts that need counting / structural inspection:
//
//   logic-in-view      (ERROR) — 2+ useState in one view; an event handler
//                                 whose body branches / has 2+ statements /
//                                 awaits; a derivation const initialised by
//                                 .map/.filter/.sort/.reduce that is NOT inline
//                                 in JSX (assigned to a const, then used).
//   single-use-state   (WARN)  — exactly ONE useState. A single boolean toggle
//                                 (isOpen/isExpanded) is allowed inline, but a
//                                 single useState holding business/derived state
//                                 still belongs in a hook — and the two are not
//                                 statically distinguishable, so this is
//                                 guidance, not a hard gate.
//
// Both rules ONLY run on files the config scopes to them (the component/screen
// override globs); they do not self-filter by filename so the override stays
// the single source of scope truth (matching the other local rules).

const USE_STATE_NAME = 'useState'

// Array methods that PRODUCE a new shape when their result is captured. .find
// returns a single element (not a new collection) and is intentionally omitted:
// `const x = list.find(...)` is a lookup, not a view-model transform.
const DERIVATION_METHODS = new Set([
  'filter',
  'flatMap',
  'map',
  'reduce',
  'sort'
])

// Handler attribute names look like onPress / onClick / onChange (on + Cap).
const ON_HANDLER_ATTR_RE = /^on[A-Z]/
// Handler variable names look like handleSubmit / onSelect.
const HANDLER_VAR_RE = /^(handle|on)[A-Z]/

// True when a function body (arrow or block) contains control-flow branching,
// 2+ statements, or an await — i.e. it carries behaviour, not a single
// pass-through expression.
const handlerBodyHasLogic = (fn) => {
  const body = fn.body
  // Expression-bodied arrow: onPress={() => doThing()} — single expression,
  // allowed. An immediate await still counts as logic.
  if (body.type !== 'BlockStatement') {
    return body.type === 'AwaitExpression' || fn.async === true
  }
  const statements = body.body
  if (statements.length >= 2) return true
  if (fn.async === true) return true
  return statements.some(
    (stmt) =>
      stmt.type === 'IfStatement' ||
      stmt.type === 'SwitchStatement' ||
      stmt.type === 'TryStatement' ||
      stmt.type === 'ForStatement' ||
      stmt.type === 'ForOfStatement' ||
      stmt.type === 'WhileStatement' ||
      (stmt.type === 'ExpressionStatement' &&
        stmt.expression.type === 'AwaitExpression')
  )
}

// True when a function literal is the value of an on*-handler JSX attribute.
const isHandlerJsxAttribute = (fn) => {
  const container = fn.parent
  if (!container || container.type !== 'JSXExpressionContainer')
    return false
  const attr = container.parent
  return (
    attr !== undefined &&
    attr.type === 'JSXAttribute' &&
    attr.name !== undefined &&
    typeof attr.name.name === 'string' &&
    ON_HANDLER_ATTR_RE.test(attr.name.name)
  )
}

// True when a function literal is assigned to a `const handle*/on*` declarator.
const isHandlerVariable = (fn) => {
  const declarator = fn.parent
  return (
    declarator !== undefined &&
    declarator.type === 'VariableDeclarator' &&
    declarator.id !== undefined &&
    declarator.id.type === 'Identifier' &&
    HANDLER_VAR_RE.test(declarator.id.name)
  )
}

// True when a node is (transitively) the direct child of a JSXExpression
// container — i.e. it is rendered inline like {arr.map(...)} rather than
// captured into a const. Walks past wrapping member/call chains so
// {arr.filter(...).map(...)} is still recognised as inline.
const isInlineJsxExpression = (node) => {
  let current = node
  while (current.parent !== undefined) {
    const parent = current.parent
    if (parent.type === 'JSXExpressionContainer') return true
    if (
      parent.type === 'CallExpression' ||
      parent.type === 'MemberExpression' ||
      parent.type === 'ChainExpression' ||
      parent.type === 'LogicalExpression' ||
      parent.type === 'ConditionalExpression'
    ) {
      current = parent
      continue
    }
    return false
  }
  return false
}

// Extract the trailing array-method name from a (possibly chained) call
// expression: arr.filter(...).map(...) → 'map'.
const derivationMethodOf = (node) => {
  if (node.type !== 'CallExpression') return undefined
  const callee = node.callee
  if (
    callee.type !== 'MemberExpression' ||
    callee.property === undefined
  ) {
    return undefined
  }
  const name = callee.property.name
  return DERIVATION_METHODS.has(name) ? name : undefined
}

const logicInView = {
  meta: {
    docs: {
      description:
        'Screens/components stay render-only — 2+ useState, branching handlers, and captured .map/.filter/.sort/.reduce derivations belong in a use{Name}.hook.ts (code-standards: logic-in-hook).'
    },
    messages: {
      derivation:
        'Move this {{method}}() derivation into a use{Name}.hook.ts — captured data transforms produce a new shape and are logic, not render (code-standards: logic-in-hook). Inline {arr.map(...)} in JSX is still allowed.',
      handler:
        'This handler branches / has multiple statements / awaits — extract it into a use{Name}.hook.ts and pass the result down (code-standards: logic-in-hook). Single pass-through handlers (onPress={() => onPress?.()}) stay inline.',
      multiState:
        'A screen/component with {{count}} useState calls holds state logic — move it into a use{Name}.hook.ts so the view stays render-only (code-standards: logic-in-hook).'
    },
    schema: [],
    type: 'suggestion'
  },
  create(context) {
    const useStateNodes = []

    return {
      'Program:exit'() {
        if (useStateNodes.length >= 2) {
          for (const node of useStateNodes) {
            context.report({
              data: { count: String(useStateNodes.length) },
              messageId: 'multiState',
              node
            })
          }
        }
      },
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === USE_STATE_NAME
        ) {
          useStateNodes.push(node)
        }
      },
      'ArrowFunctionExpression, FunctionExpression'(node) {
        if (!isHandlerJsxAttribute(node) && !isHandlerVariable(node))
          return
        if (handlerBodyHasLogic(node)) {
          context.report({ messageId: 'handler', node })
        }
      },
      VariableDeclarator(node) {
        if (node.init === null || node.init === undefined) return
        const method = derivationMethodOf(node.init)
        if (method === undefined) return
        if (isInlineJsxExpression(node.init)) return
        context.report({
          data: { method },
          messageId: 'derivation',
          node: node.init
        })
      }
    }
  }
}

const singleUseState = {
  meta: {
    docs: {
      description:
        'A single useState in a screen/component may be a trivial toggle (allowed) or business state (belongs in a hook) — surfaced as guidance since the two are not statically distinguishable (code-standards: logic-in-hook).'
    },
    messages: {
      singleState:
        'This screen/component owns a useState. A single trivial boolean toggle (isOpen/isExpanded) is allowed inline, but business/derived state belongs in a use{Name}.hook.ts (code-standards: logic-in-hook).'
    },
    schema: [],
    type: 'suggestion'
  },
  create(context) {
    const useStateNodes = []

    return {
      'Program:exit'() {
        // Exactly one useState → guidance. 2+ is handled (as ERROR) by
        // logic-in-view; 0 is fine.
        if (useStateNodes.length !== 1) return
        context.report({
          messageId: 'singleState',
          node: useStateNodes[0]
        })
      },
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === USE_STATE_NAME
        ) {
          useStateNodes.push(node)
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Rule: core-import-boundary
// packages/core is the innermost layer: framework-agnostic and vendor-free by
// construction. Its production files import only their own modules, through
// the `#src/` key of core's package.json "imports" (a test pins that it maps
// into core's own src). A relative path is passed here and refused by
// package-src-alias instead. Any other `#` key is reported like a
// vendor. An `@/` alias resolves against the consuming app's src when
// core compiles from source, and `node:` builtins do not exist in React Native
// or the browser. Re-exports (`export ... from`) and `import()` with a literal
// specifier are judged like imports. Vendors enter through ports implemented
// OUTSIDE core.
// ---------------------------------------------------------------------------

const CORE_OWN_PREFIXES = [SRC_ALIAS, './', '../']

const literalSource = ({ node }) =>
  node.source?.type === 'Literal' && typeof node.source.value === 'string'
    ? node.source
    : null

const coreImportBoundary = {
  create(context) {
    const check = (node) => {
      const source = literalSource({ node })?.value
      if (typeof source !== 'string') return
      if (CORE_OWN_PREFIXES.some((prefix) => source.startsWith(prefix))) {
        return
      }
      context.report({
        data: { source },
        messageId: 'vendorInCore',
        node: node.source
      })
    }

    return {
      ExportAllDeclaration: check,
      ExportNamedDeclaration: check,
      ImportDeclaration: check,
      ImportExpression: check
    }
  },
  meta: {
    docs: {
      description:
        'packages/core imports nothing external — its own modules only, through `#src/` (clean-architecture dependency rule).'
    },
    messages: {
      vendorInCore:
        "'{{source}}' inside packages/core — the domain layer imports only its own modules, through `#src/` (no package, no `@/` alias, no other `#` key, no `node:` builtin). Implement the vendor behind a port OUTSIDE core."
    },
    schema: [],
    type: 'problem'
  }
}

// ---------------------------------------------------------------------------
// Rule: package-src-alias (code-standards §2)
// A package source reaches its own modules through the `#src/` key of its
// package.json, never by `./`, `../` or the `@/` alias, which resolves against
// the consuming app's src. Imports, re-exports and `import()` with a literal
// specifier are all judged. The fix writes the `#src/` form of the file the
// specifier resolves to, computed from the file's own path, and only when that
// alias resolves back to the same file through the package's whole "imports"
// map; a path that leaves the package's src, a missing file and a file no
// alias reaches are reported without one. Scoped to the packages' production
// files in eslint.config.mjs.
// ---------------------------------------------------------------------------

const packageSrcAlias = {
  create(context) {
    const filename = context.filename ?? context.getFilename()
    const check = (node) => {
      const literal = literalSource({ node })
      if (!literal) return
      const verdict = toSrcAlias({ filename, source: literal.value })
      if (!verdict) return
      const quote = literal.raw[0]
      context.report({
        data: { source: literal.value },
        messageId: 'useSrcAlias',
        node: literal,
        ...(verdict.alias && {
          fix: (fixer) =>
            fixer.replaceText(literal, `${quote}${verdict.alias}${quote}`)
        })
      })
    }

    return {
      ExportAllDeclaration: check,
      ExportNamedDeclaration: check,
      ImportDeclaration: check,
      ImportExpression: check
    }
  },
  meta: {
    docs: {
      description:
        'A package source imports its own modules through `#src/` (code-standards §2).'
    },
    fixable: 'code',
    messages: {
      useSrcAlias:
        "'{{source}}' in a package source — reach the package's own modules through `#src/` (its package.json \"imports\"), and another workspace by its `@app/*` name."
    },
    schema: [],
    type: 'problem'
  }
}

// ---------------------------------------------------------------------------
// Rule: no-justifying-comment (code-standards §1.2)
// A comment states what the code does. It is not a defense of the choice
// against alternatives, and never a log of how the change was made. Only the
// narrow phrase set in ./justifying-comment.detect.mjs fails the build; the
// broader grep tell in §1.2 stays a review aid.
// ---------------------------------------------------------------------------

const noJustifyingComment = {
  create(context) {
    const source = context.sourceCode ?? context.getSourceCode()

    return {
      Program() {
        for (const comment of source.getAllComments()) {
          const hit = findJustifyingPhrase(comment.value)
          if (!hit) continue
          context.report({
            data: { phrase: hit.label },
            loc: comment.loc,
            messageId: 'justifyingComment'
          })
        }
      }
    }
  },
  meta: {
    docs: {
      description:
        'Comments state what the code does, not why an alternative was rejected (code-standards §1.2).'
    },
    messages: {
      justifyingComment:
        'This comment argues for the code ("{{phrase}}") instead of stating what it does. Move the reasoning to the commit message or an ADR — code-standards §1.2.'
    },
    schema: [],
    type: 'suggestion'
  }
}

// ---------------------------------------------------------------------------
// Rule: suffix-contract (code-standards §3.1)
// A *.component.tsx / *.screen.tsx / *.hook.ts declares no top-level type and
// no top-level SCREAMING_SNAKE const. Those belong to the block's *.type.ts
// and *.constant.ts. Detection is shared with the test suite so the gate and
// its fixtures judge a file with the same code.
// ---------------------------------------------------------------------------

const suffixContract = {
  create(context) {
    return {
      Program(node) {
        for (const violation of collectTopLevelViolations(node.body)) {
          context.report({
            data: { name: violation.name ?? '' },
            messageId:
              violation.kind === 'type' ? 'typeInView' : 'constInView',
            node: violation.node
          })
        }
      }
    }
  },
  meta: {
    docs: {
      description:
        'A view or hook file declares no top-level types and no SCREAMING_SNAKE constants — they belong to the block siblings that own them by suffix (code-standards §3.1).'
    },
    messages: {
      constInView:
        "Top-level constant '{{name}}' in a view or hook — move it to the block's *.constant.ts (code-standards §3.1).",
      typeInView:
        "Top-level type declaration in a view or hook — move it to the block's *.type.ts (code-standards §3.1). There is no single-use exception: that is how a block's contract ends up buried in a .tsx with a dozen importers."
    },
    schema: [],
    type: 'problem'
  }
}

// ---------------------------------------------------------------------------
// Rule: pure-domain-adapter (code-standards Rule 6)
// A domain adapter under src/services/**/*.adapter.ts maps DTO -> domain shape
// and nothing else. The transport lives in the sibling *.service.ts, so the
// adapter is synchronous by construction: no async, no await, no fetch.
//
// Stated as purity, not as a vendor list, so it holds whichever backend a
// project selects at init. The transport adapters under src/lib/ are a
// different artifact and out of scope — this rule is wired to services only.
// ---------------------------------------------------------------------------

const pureDomainAdapter = {
  create(context) {
    const reportAsync = (node) => {
      if (!node.async) return
      context.report({ messageId: 'asyncAdapter', node })
    }

    return {
      ArrowFunctionExpression: reportAsync,
      AwaitExpression(node) {
        context.report({ messageId: 'awaitInAdapter', node })
      },
      CallExpression(node) {
        const { callee } = node
        const isFetch =
          (callee.type === 'Identifier' && callee.name === 'fetch') ||
          (callee.type === 'MemberExpression' &&
            callee.property &&
            callee.property.name === 'fetch')
        if (isFetch) context.report({ messageId: 'ioInAdapter', node })
      },
      FunctionDeclaration: reportAsync,
      FunctionExpression: reportAsync
    }
  },
  meta: {
    docs: {
      description:
        'A domain adapter is a pure DTO -> domain mapper: no async, no await, no fetch. Transport belongs in the sibling *.service.ts (code-standards Rule 6).'
    },
    messages: {
      asyncAdapter:
        'A domain adapter is synchronous — an `async` here means transport leaked in from the sibling *.service.ts (code-standards Rule 6).',
      awaitInAdapter:
        'No `await` in a domain adapter — it maps a DTO the service already resolved (code-standards Rule 6).',
      ioInAdapter:
        'No fetch() in a domain adapter — move the transport to the sibling *.service.ts (code-standards Rule 6).'
    },
    schema: [],
    type: 'problem'
  }
}

// ---------------------------------------------------------------------------
// Rules: style-positions-only and style-token-values (AGENTS.md § Styling
// lives in the components; code-standards §22)
// A screen, a route entry or a container only positions: its class strings,
// StyleSheet entries and style slots carry layout, spacing, size, position,
// overflow and visibility. The look lives in a component block
// (components/ui, or a screen's own components/), and every value, in every
// style file and view of both apps, comes from @app/tokens.
//
// Both rules scope themselves from the file's path through
// ./style-positioning.detect.mjs, which the freshness gate also reads. A
// file listed under a rule in eslint-style-positioning-allowlist.json is
// skipped by that rule; scripts/verify-allowlist-freshness.mjs fails an entry
// whose file no longer breaks it, so the list only shrinks.
// ---------------------------------------------------------------------------

const readStyleAllowlist = () => {
  try {
    const parsed = JSON.parse(
      readFileSync(
        new URL(`../${STYLE_ALLOWLIST_FILE}`, import.meta.url),
        'utf8'
      )
    )
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const STYLE_ALLOWLIST = readStyleAllowlist()

const styleRule = ({ collect, meta, rule, scopeOf }) => ({
  create(context) {
    const scope = scopeOf(context.filename ?? context.getFilename())
    if (!scope) return {}
    if (
      isAllowlisted({ allowlist: STYLE_ALLOWLIST, path: scope.path, rule })
    ) {
      return {}
    }
    return {
      Program(program) {
        for (const { kind, node, ...data } of collect({
          kind: scope.kind,
          program
        })) {
          context.report({ data, messageId: kind, node })
        }
      }
    }
  },
  meta
})

const LOOK_HOME =
  "Render the component block that owns this look (components/ui, or a block in the screen's own components/), or add it there as a variant (AGENTS.md § Styling lives in the components)."

const stylePositionsOnly = styleRule({
  collect: collectPositioningViolations,
  meta: {
    docs: {
      description:
        'A screen, a route entry or a container only positions: its classes, StyleSheet entries and style slots carry layout, spacing, size, position, overflow and visibility. The look lives in a component block.'
    },
    messages: {
      classToken: `'{{token}}' is {{category}}, and a screen or section style only positions. ${LOOK_HOME}`,
      styleKey: `The style key '{{key}}' is not positioning, and a screen or section style only positions. ${LOOK_HOME}`,
      styleNotLiteral:
        'A screen or section style prop is an object literal with plain keys, so each key can be checked as positioning. Pass computed values as CSS custom properties, or move the styled element into a component block.'
    },
    schema: [],
    type: 'problem'
  },
  rule: STYLE_RULE.POSITIONS_ONLY,
  scopeOf: positionsOnlyScope
})

const styleTokenValues = styleRule({
  collect: collectTokenValueViolations,
  meta: {
    docs: {
      description:
        'Every style value comes from @app/tokens: no raw colour, no Tailwind palette colour, no arbitrary value.'
    },
    messages: {
      arbitraryValue:
        "'{{token}}' is an arbitrary value. Every style value comes from @app/tokens: use a token utility or a Tailwind scale step, and add a token to packages/tokens only when none fits.",
      paletteColor:
        "'{{token}}' is a Tailwind palette colour, not a design token. Use the colour token that carries this role (bg-scrim, bg-neutral-tint, border-divider).",
      rawColor:
        "'{{value}}' is a raw colour. Every colour comes from @app/tokens: a token utility on web (bg-accent), a token constant on mobile (colors.accent)."
    },
    schema: [],
    type: 'problem'
  },
  rule: STYLE_RULE.TOKEN_VALUES,
  scopeOf: tokenValuesScope
})

// ---------------------------------------------------------------------------
// Rule: ui-kit-boundary (AGENTS.md § Styling lives in the components)
// Only a block under components/ui imports a UI kit: a component library, its
// headless primitives or the class helpers it brings (./ui-kit.detect.mjs).
// Screens, sections and screen-local components import the ui blocks, so a
// kit is swapped by rewriting components/ui alone. Imports, re-exports and
// `import()` with a literal specifier are judged; the rule scopes itself from
// the file's path, like the two style rules.
// ---------------------------------------------------------------------------

const uiKitBoundary = {
  create(context) {
    if (!isOutsideUiKit(context.filename ?? context.getFilename()))
      return {}
    const check = (node) => {
      const source = literalSource({ node })?.value
      if (typeof source !== 'string' || !isUiKitSource(source)) return
      context.report({
        data: { source },
        messageId: 'kitOutsideUi',
        node: node.source
      })
    }

    return {
      ExportAllDeclaration: check,
      ExportNamedDeclaration: check,
      ImportDeclaration: check,
      ImportExpression: check
    }
  },
  meta: {
    docs: {
      description:
        'Only a components/ui block imports a UI kit, so the look and the kit live in one replaceable layer.'
    },
    messages: {
      kitOutsideUi:
        "'{{source}}' is a UI kit, and only a components/ui block may import one: the look and the kit live in one replaceable layer. Render the ui block that wraps it, or add that wrapper to components/ui (AGENTS.md § Styling lives in the components)."
    },
    schema: [],
    type: 'problem'
  }
}

// ---------------------------------------------------------------------------
// Rule: dependency-seam (code-standards §23)
// Every package is registered in .agents/contracts/dependencies.json and
// imported only inside its seam (./dependency-seam.detect.mjs); a package
// nobody registered fails, closed. The registry and the frozen allowlist are
// read once per lint run from the repository root this plugin lives in, and
// the file's path is taken relative to that root, so the verdict is the same
// whichever folder ESLint runs from.
// ---------------------------------------------------------------------------

const SEAM_ROOT = fileURLToPath(new URL('..', import.meta.url))
const SEAM_INPUTS = readSeamInputs({ root: SEAM_ROOT })
const SEAM_INDEX = indexRegistry({ registry: SEAM_INPUTS.registry })
const NO_SEAM = 'no file yet'

const dependencySeam = {
  create(context) {
    const path = toRepoPath({
      filename: context.filename ?? context.getFilename(),
      root: SEAM_ROOT
    })
    if (!path || !isInScope({ path })) return {}
    return {
      Program(program) {
        for (const { entry, kind, node, source } of collectSeamViolations({
          allowlist: SEAM_INPUTS.allowlist,
          index: SEAM_INDEX,
          path,
          program
        })) {
          const seam = Array.isArray(entry?.seam) ? entry.seam : []
          context.report({
            data: {
              category: entry?.category ?? '',
              name: entry?.name ?? '',
              seam: seam.length > 0 ? seam.join(', ') : NO_SEAM,
              source
            },
            messageId: kind,
            node
          })
        }
      }
    }
  },
  meta: {
    docs: {
      description:
        'Every package is registered in .agents/contracts/dependencies.json and imported only inside its seam; an unregistered package fails, closed.'
    },
    messages: {
      outsideSeam:
        "'{{source}}' is {{category}} ('{{name}}' in .agents/contracts/dependencies.json), and only its seam may import it: {{seam}}. Import the project module that wraps it (a @/lib/* adapter, a components/ui block, an @app/* package), or move this code into the seam (code-standards §23).",
      unregistered:
        "'{{source}}' is not in .agents/contracts/dependencies.json, so no file may import it. Register the package with its category and the seam that wraps it before any code uses it (code-standards §23)."
    },
    schema: [],
    type: 'problem'
  }
}

const plugin = {
  meta: { name: 'local', version: '1.0.0' },
  rules: {
    'core-import-boundary': coreImportBoundary,
    'dependency-seam': dependencySeam,
    'pure-domain-adapter': pureDomainAdapter,
    'logic-in-view': logicInView,
    'no-inline-tailwind-classname': noInlineTailwindClassname,
    'no-justifying-comment': noJustifyingComment,
    'no-non-ascii-identifier': noNonAsciiIdentifier,
    'package-src-alias': packageSrcAlias,
    'single-object-params': singleObjectParams,
    'single-use-state': singleUseState,
    'style-positions-only': stylePositionsOnly,
    'style-token-values': styleTokenValues,
    'suffix-contract': suffixContract,
    'ui-kit-boundary': uiKitBoundary
  }
}

export default plugin
