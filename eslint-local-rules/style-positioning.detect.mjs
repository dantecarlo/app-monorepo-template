// @ts-check
// ---------------------------------------------------------------------------
// style-positioning.detect — the styling pillar, as data.
//
// Shared by the ESLint rules local/style-positions-only and
// local/style-token-values (./index.mjs) and by the allowlist freshness gate
// (scripts/verify-allowlist-freshness.mjs), so the rules and the gate judge a
// file with the same code and the same scope.
//
// Two checks, one per rule:
//   - positions only: outside the component blocks (components/ui/** and a
//     screen's own components/**), a style only positions. A class token's
//     base utility (the part after its variants) is a positioning utility, and
//     a style declaration (a React Native StyleSheet entry, an inline style
//     object) has a positioning property as its key.
//   - token values: in every style file and view of every app, a value comes
//     from the design tokens: no raw colour literal, no Tailwind palette
//     colour, and no arbitrary value (`[…]` or `(…)`) in a class token.
//
// The positioning lists are allowlists: a token or key that is not listed as
// positioning is reported whatever it is, so a styling utility nobody listed
// cannot slip through. The category in a report only names where it belongs.
// ---------------------------------------------------------------------------

// Display, position, stacking and visibility utilities that carry no value.
const POSITIONING_EXACT = new Set([
  'absolute',
  'block',
  'box-border',
  'box-content',
  'collapse',
  'container',
  // align-content only: `content-['…']` and `content-none` set generated
  // text, so the family is not a prefix.
  'content-around',
  'content-baseline',
  'content-between',
  'content-center',
  'content-end',
  'content-evenly',
  'content-normal',
  'content-start',
  'content-stretch',
  'contents',
  'fixed',
  'flex',
  'flow-root',
  'grid',
  'grow',
  'group',
  'hidden',
  'inline',
  'inline-block',
  'inline-flex',
  'inline-grid',
  'invisible',
  'isolate',
  'isolation-auto',
  'list-item',
  'not-sr-only',
  'peer',
  'relative',
  'shrink',
  'sr-only',
  'static',
  'sticky',
  'table',
  'table-cell',
  'table-row',
  'text-center',
  'text-end',
  'text-justify',
  'text-left',
  'text-nowrap',
  'text-right',
  'text-start',
  'text-wrap',
  'truncate',
  'visible'
])

// Families whose every value is layout: `${prefix}-<value>`.
const POSITIONING_PREFIXES = [
  'align',
  'aspect',
  'auto-cols',
  'auto-rows',
  'basis',
  'bottom',
  'break',
  'clear',
  'col',
  'columns',
  'contain',
  'end',
  'flex',
  'float',
  'gap',
  'grid-cols',
  'grid-flow',
  'grid-rows',
  'grow',
  'h',
  'inset',
  'items',
  'justify',
  'left',
  'line-clamp',
  'm',
  'max-h',
  'max-w',
  'mb',
  'me',
  'min-h',
  'min-w',
  'ml',
  'mr',
  'ms',
  'mt',
  'mx',
  'my',
  'object',
  'order',
  'overflow',
  'overscroll',
  'p',
  'pb',
  'pe',
  'pl',
  'place',
  'pointer-events',
  'pr',
  'ps',
  'pt',
  'px',
  'py',
  'right',
  'row',
  'scroll-m',
  'scroll-mb',
  'scroll-ml',
  'scroll-mr',
  'scroll-mt',
  'scroll-mx',
  'scroll-my',
  'scroll-p',
  'scroll-pb',
  'scroll-pl',
  'scroll-pr',
  'scroll-pt',
  'scroll-px',
  'scroll-py',
  'self',
  'shrink',
  'size',
  'snap',
  'space-x',
  'space-y',
  'start',
  'top',
  'touch',
  'translate',
  'translate-x',
  'translate-y',
  'w',
  'whitespace',
  'z'
]

// Positioning CSS properties, in their kebab-case spelling. An arbitrary
// property (`[grid-template-columns:…]`), an inline style key and a React
// Native StyleSheet key (camelCase) all resolve against this set.
const POSITIONING_PROPERTIES = new Set([
  'align-content',
  'align-items',
  'align-self',
  'aspect-ratio',
  'block-size',
  'bottom',
  'box-sizing',
  'column-gap',
  'contain',
  'direction',
  'display',
  'end',
  'flex',
  'flex-basis',
  'flex-direction',
  'flex-flow',
  'flex-grow',
  'flex-shrink',
  'flex-wrap',
  'gap',
  'grid',
  'grid-area',
  'grid-auto-columns',
  'grid-auto-flow',
  'grid-auto-rows',
  'grid-column',
  'grid-column-end',
  'grid-column-start',
  'grid-row',
  'grid-row-end',
  'grid-row-start',
  'grid-template',
  'grid-template-areas',
  'grid-template-columns',
  'grid-template-rows',
  'height',
  'inline-size',
  'isolation',
  'justify-content',
  'justify-items',
  'justify-self',
  'left',
  'max-block-size',
  'max-height',
  'max-inline-size',
  'max-width',
  'min-block-size',
  'min-height',
  'min-inline-size',
  'min-width',
  'object-fit',
  'object-position',
  'order',
  'overflow',
  'overflow-wrap',
  'overflow-x',
  'overflow-y',
  'place-content',
  'place-items',
  'place-self',
  'pointer-events',
  'position',
  'right',
  'row-gap',
  'start',
  'text-align',
  'text-align-vertical',
  'top',
  'touch-action',
  'translate',
  'vertical-align',
  'visibility',
  'white-space',
  'width',
  'word-break',
  'z-index'
])

// Property families every member of which positions. React Native spells
// some members its own way (`paddingHorizontal`, `marginVertical`).
const POSITIONING_PROPERTY_PREFIXES = [
  'inset',
  'margin',
  'overscroll-behavior',
  'padding',
  'scroll-margin',
  'scroll-padding'
]

// A style key that is not positioning but still a style declaration: the
// visual families of CSS and React Native. A key matching neither list is not
// a declaration (a StyleSheet entry name, a constant name), so its string
// value is read as a class list.
const VISUAL_PROPERTY_RE =
  /^(accent|animation|backdrop|backface|background|border|box|caret|color|cursor|elevation|fill|filter|font|include|letter|line|mix|opacity|outline|overlay|resize|shadow|stroke|text|tint|transform|transition|user)/

// Where a non-positioning token belongs, for the report. Checked in order:
// a font-size token must be read as typography before `text-` reads as color.
const CATEGORIES = [
  [
    'typography',
    /^(font-|text-(amount|amount-hero|body|button|caption|display|heading|label|title|xs|sm|base|lg|[2-9]?xl|balance|pretty|ellipsis|clip|\[length)|leading-|tracking-|italic$|not-italic$|uppercase$|lowercase$|capitalize$|normal-case$|antialiased$|subpixel-antialiased$|(tabular|oldstyle|lining|proportional)-nums$|ordinal$|slashed-zero$|(diagonal|stacked)-fractions$|underline|overline$|line-through$|no-underline$|decoration-|list-|indent-|hyphens-)/
  ],
  ['border', /^(border|rounded|ring|inset-ring|outline|divide)/],
  [
    'effect',
    /^(shadow|inset-shadow|opacity|blur|backdrop-|mix-blend|bg-blend|drop-shadow|brightness|contrast|saturate|grayscale|invert|sepia|hue-rotate|filter|mask-|glass-card|aurora)/
  ],
  [
    'motion',
    /^(transition|duration|ease|animate|delay|scale|rotate|skew|transform|will-change|origin|perspective|backface)/
  ],
  [
    'color',
    /^(text-|bg-|fill-|stroke-|from-|via-|to-|accent-|caret-|placeholder|scheme-)/
  ],
  ['interaction', /^(cursor|select|resize|appearance)/]
]

// The default Tailwind palette: a colour utility naming one of these does
// not come from @app/tokens, which define every colour the apps paint.
const PALETTE_COLOR_RE =
  /^(bg|text|border(-[trblxyse])?|ring|ring-offset|outline|fill|stroke|from|via|to|decoration|divide|shadow|accent|caret|placeholder)-(white|black|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})(\/.+)?$/

// A raw colour: a hex literal, or a colour function with literal arguments.
const RAW_HEX_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const COLOR_FUNCTION_RE = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i

// JSX attributes that carry a colour value rather than a class list.
const COLOR_ATTRIBUTE_RE = /(^colors?$|Color$|^fill$|^stroke$)/

// ---------------------------------------------------------------------------
// Scope — which files each check applies to. The rules read it and so does
// the freshness gate, so they cannot disagree about a path.
// ---------------------------------------------------------------------------

const APP_SOURCE_RE = /(?:^|\/)(apps\/[^/]+\/src\/.+)$/
const TEST_PATH_RE =
  /(?:^|\/)(?:__tests__|__mocks__)\/|\.(?:test|spec)\.[cm]?[jt]sx?$|^apps\/[^/]+\/src\/test\//
const COMPONENT_BLOCK_RE =
  /^apps\/[^/]+\/src\/(?:components\/ui\/|screens\/[^/]+\/components\/)/

export const FILE_KIND = Object.freeze({ STYLE: 'style', VIEW: 'view' })

// The repository-relative path of an app source file (`apps/<app>/src/…`),
// or null for any other file. Absolute paths and Windows separators are
// accepted: only the part from `apps/` on is kept.
export const toAppSourcePath = (filename) => {
  const match = APP_SOURCE_RE.exec(String(filename).replaceAll('\\', '/'))
  return match ? match[1] : null
}

const fileKindOf = (path) => {
  if (path.endsWith('.style.ts')) return FILE_KIND.STYLE
  if (path.endsWith('.tsx')) return FILE_KIND.VIEW
  return null
}

// `{ kind }` when the token-values check applies to the file, else null.
export const tokenValuesScope = (filename) => {
  const path = toAppSourcePath(filename)
  if (!path || TEST_PATH_RE.test(path)) return null
  const kind = fileKindOf(path)
  return kind ? { kind, path } : null
}

// `{ kind }` when the positions-only check applies: a screen, a route entry
// or a container outside the component blocks.
export const positionsOnlyScope = (filename) => {
  const scope = tokenValuesScope(filename)
  if (!scope || COMPONENT_BLOCK_RE.test(scope.path)) return null
  return scope
}

// The exemption list both rules read, at the repository root. An entry is
// `{ path, rule, reason }`: it exempts one file from one rule, and says why
// the value cannot move. scripts/verify-allowlist-freshness.mjs fails an
// entry whose file no longer breaks its rule, so the list only shrinks.
export const STYLE_ALLOWLIST_FILE =
  'eslint-style-positioning-allowlist.json'

export const STYLE_RULE = Object.freeze({
  POSITIONS_ONLY: 'style-positions-only',
  TOKEN_VALUES: 'style-token-values'
})

export const isAllowlisted = ({ allowlist, path, rule }) =>
  allowlist.some((entry) => entry?.path === path && entry?.rule === rule)

// ---------------------------------------------------------------------------
// Class tokens
// ---------------------------------------------------------------------------

const toKebab = (name) =>
  name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

const isPositioningProperty = (property) =>
  POSITIONING_PROPERTIES.has(property) ||
  POSITIONING_PROPERTY_PREFIXES.some(
    (prefix) => property === prefix || property.startsWith(`${prefix}-`)
  )

// Variants are separated by `:` outside brackets and parentheses, so the
// `:` inside `[animation-delay:-2s]` or `data-[state=open]:` is not one.
const OPENERS = new Set(['(', '['])
const CLOSERS = new Set([')', ']'])

const baseUtility = (token) => {
  const { start } = [...token].reduce(
    (scan, char, index) => {
      if (OPENERS.has(char)) return { ...scan, depth: scan.depth + 1 }
      if (CLOSERS.has(char)) return { ...scan, depth: scan.depth - 1 }
      if (char === ':' && scan.depth === 0) {
        return { ...scan, start: index + 1 }
      }
      return scan
    },
    { depth: 0, start: 0 }
  )
  return token
    .slice(start)
    .replace(/^!/, '')
    .replace(/!$/, '')
    .replace(/^-/, '')
}

const isPositioningUtility = (base) => {
  const arbitrary = /^\[([a-z-]+):.+\]$/.exec(base)
  if (arbitrary) return isPositioningProperty(arbitrary[1])
  if (POSITIONING_EXACT.has(base)) return true
  if (/^(inset-shadow|inset-ring)/.test(base)) return false
  return POSITIONING_PREFIXES.some((prefix) =>
    base.startsWith(`${prefix}-`)
  )
}

const categoryOf = (base) => {
  if (/^\[[a-z-]+:.+\]$/.test(base)) return 'arbitrary-property'
  const match = CATEGORIES.find(([, pattern]) => pattern.test(base))
  return match ? match[0] : 'other'
}

const splitTokens = (value) => value.split(/\s+/).filter(Boolean)

// Every non-positioning token of one class string. A token an expression
// cuts in half (`text-${tone}`) is judged by the half it shows.
const findStylingClassTokens = (value) =>
  splitTokens(value).flatMap((token) => {
    const base = baseUtility(token)
    if (!base || isPositioningUtility(base)) return []
    return [{ category: categoryOf(base), token }]
  })

const isRawColor = (value) =>
  RAW_HEX_RE.test(value.trim()) ||
  COLOR_FUNCTION_RE.test(value) ||
  splitTokens(value).some((token) => RAW_HEX_RE.test(token))

// Every token-value problem of one class string: a raw colour, a palette
// colour or an arbitrary value in the base utility.
const findClassValueProblems = (value) =>
  splitTokens(value).flatMap((token) => {
    const base = baseUtility(token)
    if (!base) return []
    if (RAW_HEX_RE.test(base) || COLOR_FUNCTION_RE.test(base)) {
      return [{ kind: 'rawColor', value: token }]
    }
    if (/[[(]/.test(base)) return [{ kind: 'arbitraryValue', token }]
    if (PALETTE_COLOR_RE.test(base))
      return [{ kind: 'paletteColor', token }]
    return []
  })

// ---------------------------------------------------------------------------
// AST walking
// ---------------------------------------------------------------------------

// Children that hold types, never runtime values.
const TYPE_KEYS = new Set([
  'returnType',
  'typeAnnotation',
  'typeParameters'
])
const TYPE_NODES = new Set([
  'TSDeclareFunction',
  'TSEnumDeclaration',
  'TSInterfaceDeclaration',
  'TSModuleDeclaration',
  'TSTypeAliasDeclaration'
])
const SOURCE_PARENTS = new Set([
  'ExportAllDeclaration',
  'ExportNamedDeclaration',
  'ImportDeclaration',
  'ImportExpression'
])
// In a tailwind-variants config these hold variant NAMES, not classes.
const VARIANT_NAME_KEYS = new Set(['defaultVariants'])
const CLASS_KEYS = new Set(['class', 'className'])
const TYPE_WRAPPERS = new Set(['TSAsExpression', 'TSSatisfiesExpression'])

const keyName = (property) => {
  const key = property.key
  if (!key) return undefined
  if (key.type === 'Identifier') return key.name
  if (key.type === 'Literal') return String(key.value)
  return undefined
}

const childEntries = (node) =>
  Object.entries(node).filter(
    ([key, value]) =>
      key !== 'parent' &&
      !TYPE_KEYS.has(key) &&
      value !== null &&
      typeof value === 'object'
  )

const unwrap = (expression) =>
  TYPE_WRAPPERS.has(expression?.type)
    ? unwrap(expression.expression)
    : expression

// A style declaration key: a CSS custom property, a positioning property or
// a visual one. Anything else names a style entry or a constant.
const declarationKind = (key) => {
  if (key.startsWith('--')) return 'positioning'
  if (isPositioningProperty(toKebab(key))) return 'positioning'
  if (VISUAL_PROPERTY_RE.test(key)) return 'visual'
  return null
}

// An object literal of style declarations: every key is a declaration key,
// and a nested object or array value (`shadowOffset`, `transform`) is itself
// made of declarations. A tailwind-variants `variants` map or a StyleSheet
// entry map is not one, so its strings stay class lists.
const STYLE_OBJECTS = new WeakMap()

const isStyleValue = (value) => {
  const node = unwrap(value)
  if (node?.type === 'ObjectExpression') return isStyleObject(node)
  if (node?.type === 'ArrayExpression') {
    return node.elements.every((element) => isStyleObject(unwrap(element)))
  }
  return true
}

const isStyleObject = (node) => {
  if (node?.type !== 'ObjectExpression') return false
  if (STYLE_OBJECTS.has(node)) return STYLE_OBJECTS.get(node)
  const verdict =
    node.properties.length > 0 &&
    node.properties.every(
      (property) =>
        property.type === 'Property' &&
        !property.computed &&
        keyName(property) !== undefined &&
        declarationKind(keyName(property)) !== null &&
        isStyleValue(property.value)
    )
  STYLE_OBJECTS.set(node, verdict)
  return verdict
}

// The value of `defaultVariants: { … }` names variants, and inside
// `compoundVariants: [{ size: 'lg', class: '…' }]` every property but
// `class` is a condition: neither holds a class.
const holdsVariantNames = ({ ancestors, property }) => {
  const name = keyName(property) ?? ''
  if (VARIANT_NAME_KEYS.has(name)) return true
  const [object, array, owner] = [...ancestors].reverse()
  return (
    owner?.type === 'Property' &&
    keyName(owner) === 'compoundVariants' &&
    array?.type === 'ArrayExpression' &&
    object?.type === 'ObjectExpression' &&
    !CLASS_KEYS.has(name)
  )
}

// A name that holds a style in a view: the `style` prop, a React Native
// `contentContainerStyle`, a `contentStyle` option or a `*Style` constant.
const STYLE_NAME_RE = /(?:^s|S)tyle$/
const CLASS_NAME_RE = /(?:^c|C)lassName$/
const STYLE_SLOT = 'styleSlot'

const isContainer = (value) =>
  ['ArrayExpression', 'ObjectExpression'].includes(unwrap(value)?.type)

// Walks a Program and calls `onString({ node, text, role })` for every
// string the file holds as a style: `role` is 'class' for a class list and
// 'value' for the value of a style declaration. `onDeclaration({ key,
// node })` is called for every style declaration key. A style file is read
// whole; in a view only the class attributes, the style slots and the
// colour attributes are read.
const walkStyles = ({ kind, onDeclaration, onString, program }) => {
  const isView = kind === FILE_KIND.VIEW

  // The role a child inherits: a declaration's value is a 'value', a JSX
  // class attribute holds a 'class' list, a style slot holds declarations,
  // and in a style file every other string is a class list unless it names
  // variants.
  const roleOfChild = ({ ancestors, key, node, role }) => {
    if (node.type === 'Property' && key === 'value') {
      const name = keyName(node) ?? ''
      const inSlot = role === STYLE_SLOT
      if (inSlot || (!isView && isStyleObject(ancestors.at(-1)))) {
        onDeclaration({ key: name, node })
        return inSlot && isContainer(node.value) ? STYLE_SLOT : 'value'
      }
      if (CLASS_KEYS.has(name)) return 'class'
      if (isView) {
        if (STYLE_NAME_RE.test(name)) return STYLE_SLOT
        return role === 'value' ? 'value' : null
      }
      return holdsVariantNames({ ancestors, property: node }) ? null : role
    }
    if (node.type === 'JSXAttribute' && key === 'value') {
      const name =
        node.name?.type === 'JSXIdentifier' ? node.name.name : ''
      if (CLASS_NAME_RE.test(name)) return 'class'
      if (STYLE_NAME_RE.test(name)) return STYLE_SLOT
      if (COLOR_ATTRIBUTE_RE.test(name)) return 'value'
      return null
    }
    if (
      isView &&
      node.type === 'VariableDeclarator' &&
      key === 'init' &&
      STYLE_NAME_RE.test(node.id?.name ?? '')
    ) {
      return STYLE_SLOT
    }
    return role
  }

  const visit = ({ ancestors, node, parentKey, role }) => {
    if (!node || typeof node.type !== 'string') return
    if (TYPE_NODES.has(node.type)) return
    const parent = ancestors.at(-1)
    if (node.type === 'Literal' && typeof node.value === 'string') {
      const isSource = SOURCE_PARENTS.has(parent?.type ?? '')
      const isKey = parent?.type === 'Property' && parentKey === 'key'
      const stringRole = role === STYLE_SLOT ? 'value' : role
      if (stringRole && !isSource && !isKey) {
        onString({ node, role: stringRole, text: node.value })
      }
      return
    }
    if (node.type === 'TemplateLiteral' && role) {
      const stringRole = role === STYLE_SLOT ? 'value' : role
      node.quasis.forEach((quasi) =>
        onString({
          node,
          role: stringRole,
          text: quasi.value.cooked ?? ''
        })
      )
    }
    const nextAncestors = [...ancestors, node]
    for (const [key, value] of childEntries(node)) {
      for (const child of Array.isArray(value) ? value : [value]) {
        visit({
          ancestors: nextAncestors,
          node: child,
          parentKey: key,
          role: roleOfChild({ ancestors, key, node, role })
        })
      }
    }
  }

  visit({
    ancestors: [],
    node: program,
    parentKey: null,
    role: isView ? null : 'class'
  })
}

// The style props a view cannot be judged by: a spread or a computed key in
// an inline style object hides what it sets.
const collectOpaqueStyleProps = (program) => {
  const found = []
  const visit = (node) => {
    if (!node || typeof node.type !== 'string') return
    if (
      node.type === 'JSXAttribute' &&
      node.name?.type === 'JSXIdentifier' &&
      /(^s|S)tyle$/.test(node.name.name) &&
      node.value?.type === 'JSXExpressionContainer'
    ) {
      const expression = unwrap(node.value.expression)
      const objects =
        expression?.type === 'ArrayExpression'
          ? expression.elements.map(unwrap)
          : [expression]
      objects
        .filter((object) => object?.type === 'ObjectExpression')
        .flatMap((object) => object.properties)
        .filter(
          (property) =>
            property.type !== 'Property' ||
            property.computed ||
            keyName(property) === undefined
        )
        .forEach((property) =>
          found.push({ kind: 'styleNotLiteral', node: property })
        )
    }
    for (const [, value] of childEntries(node)) {
      if (Array.isArray(value)) value.forEach(visit)
      else visit(value)
    }
  }
  visit(program)
  return found
}

// Every positioning problem of a file the positions-only check applies to:
// `classToken` for a styling class, `styleKey` for a visual declaration and
// `styleNotLiteral` for an inline style the check cannot read.
export const collectPositioningViolations = ({ kind, program }) => {
  const violations = []
  walkStyles({
    kind,
    onDeclaration: ({ key, node }) => {
      if (declarationKind(key) !== 'positioning') {
        violations.push({ key, kind: 'styleKey', node })
      }
    },
    onString: ({ node, role, text }) => {
      if (role !== 'class') return
      findStylingClassTokens(text).forEach((found) =>
        violations.push({ ...found, kind: 'classToken', node })
      )
    },
    program
  })
  if (kind === FILE_KIND.VIEW) {
    violations.push(...collectOpaqueStyleProps(program))
  }
  return violations
}

// Every token-value problem of a style file or view: `rawColor`,
// `paletteColor` and `arbitraryValue`.
export const collectTokenValueViolations = ({ kind, program }) => {
  const violations = []
  walkStyles({
    kind,
    onDeclaration: () => {},
    onString: ({ node, role, text }) => {
      if (role === 'value') {
        if (isRawColor(text)) {
          violations.push({ kind: 'rawColor', node, value: text })
        }
        return
      }
      findClassValueProblems(text).forEach((found) =>
        violations.push({ ...found, node })
      )
    },
    program
  })
  return violations
}
