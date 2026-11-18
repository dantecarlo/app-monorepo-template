import {
  type ILocaleResources,
  LanguageEnum,
  resources,
  SUPPORTED_LANGUAGES,
  type SupportedLanguageType
} from '@app/i18n'
import type { ReactElement, ReactNode } from 'react'
import { describe, expect, test, vi } from 'vitest'

// The visible text of a sample of screens and blocks, in both languages,
// against the record taken at 571d25b, before the i18n seam moved every
// import of react-i18next behind lib/i18n. The record names the catalog
// message behind each piece of text, so it holds no copy of either language
// and survives a copy change: a sample rendered with a catalog whose every
// value is its own key must equal it, and rendered with the real catalog must
// show those messages in that catalog's copy. The app name is the brand, the
// same in every catalog and rewritten by /init, so both renders pin it to
// BRAND.

// The React Native stand-in has no Modal: an open one shows its children.
vi.mock('react-native', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-native')>()),
  Modal: ({
    children,
    visible
  }: {
    children?: ReactNode
    visible: boolean
  }) => (visible ? children : null)
}))

vi.mock('@/screens/ItemsDashboard/hooks/useItems.hook', () => ({
  useItems: () => ({
    activeCount: 1,
    activeNav: 'home',
    isError: false,
    isLoading: false,
    items: [
      {
        age: { count: 3, unit: 'days' },
        authorInitials: 'AB',
        authorLabel: 'Alice B.',
        category: 'UX',
        createdAt: new Date('2026-06-22T10:00:00.000Z'),
        description: 'Streamline the first-run experience.',
        id: 'item_001',
        status: 'active',
        title: 'Improve onboarding flow'
      },
      {
        age: { count: 0, unit: 'justNow' },
        authorInitials: '',
        authorLabel: '',
        category: 'Architecture',
        createdAt: new Date('2026-06-20T10:00:00.000Z'),
        description: 'Move to the App Router with RSC.',
        id: 'item_002',
        status: 'archived',
        title: 'Migrate to App Router'
      }
    ],
    onNavChange: vi.fn(),
    onRetry: vi.fn(),
    onSearchChange: vi.fn(),
    search: '',
    totalCount: 2
  })
}))

import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState, ErrorStateCodeEnum } from '@/components/ui/ErrorState'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { ItemsDashboardScreen } from '@/screens/ItemsDashboard/ItemsDashboard.screen'
import { LoginScreen } from '@/screens/Login/Login.screen'
import { renderWithI18n } from '@/test/i18n.helper'

type CatalogType = ILocaleResources['translation']
type RecordType = Record<SupportedLanguageType, Record<string, string[]>>

// The part of a DOM node the walk reads.
interface IDomNode {
  childNodes: ArrayLike<IDomNode>
  getAttribute?: (name: string) => string | null
  nodeName: string
  textContent: string | null
}

interface ISample {
  name: string
  ui: () => ReactElement
}

const noop = () => undefined

const SAMPLES: ISample[] = [
  { name: 'sign-in screen', ui: () => <LoginScreen /> },
  { name: 'items dashboard', ui: () => <ItemsDashboardScreen /> },
  {
    name: 'error state by code',
    ui: () => (
      <ErrorState code={ErrorStateCodeEnum.NOT_FOUND} onRetry={noop} />
    )
  },
  { name: 'error state', ui: () => <ErrorState onRetry={noop} /> },
  { name: 'empty state', ui: () => <EmptyState /> },
  {
    name: 'confirmation',
    ui: () => (
      <ConfirmDialog
        isOpen
        message="Delete the draft?"
        onCancel={noop}
        onConfirm={noop}
      />
    )
  },
  { name: 'offline banner', ui: () => <OfflineBanner isOffline /> }
]

// Taken at 571d25b with the key catalog: the two languages differ only in
// the code the language button shows.
const recordIn = ({
  locale
}: {
  locale: SupportedLanguageType
}): Record<string, string[]> => ({
  confirmation: [
    '@aria-label: [[components.modal.close]]',
    '✕',
    'Delete the draft?',
    '[[common.cancel]]',
    '[[common.confirm]]'
  ],
  'empty state': [
    '✉',
    '[[components.emptyState.title]]',
    '[[components.emptyState.message]]'
  ],
  'error state': [
    '⚠',
    '[[components.errorState.title]]',
    '[[components.errorState.message]]',
    '[[components.errorState.retry]]'
  ],
  'error state by code': [
    '⚠',
    '[[components.errorState.byCode.404.title]]',
    '[[components.errorState.byCode.404.message]]',
    '[[components.errorState.retry]]'
  ],
  'items dashboard': [
    '@aria-label: Acme',
    'A',
    '[[items.dashboard.welcomeBack]]',
    '[[items.dashboard.title]]',
    '[[items.dashboard.statsOverview]]',
    '[[items.dashboard.statsLive]]',
    '2',
    '[[items.dashboard.statsTotalItems]]',
    '1',
    '[[items.dashboard.statsActive]]',
    '·',
    '[[items.dashboard.statsUpdated]]',
    '[[items.dashboard.listTitle]]',
    '[[items.dashboard.listResults|count=2]]',
    'AB',
    'Improve onboarding flow',
    'Streamline the first-run experience.',
    'UX',
    'Alice B.',
    '[[items.age.days|count=3]]',
    '[[items.status.active]]',
    'Migrate to App Router',
    'Move to the App Router with RSC.',
    'Architecture',
    '[[items.age.justNow]]',
    '[[items.status.archived]]',
    '@aria-label: [[items.dashboard.nav.ariaLabel]]',
    '[[items.dashboard.nav.home]]',
    '[[items.dashboard.nav.items]]',
    '[[items.dashboard.nav.search]]',
    '[[items.dashboard.nav.settings]]'
  ],
  'offline banner': ['[[helper.offline.message]]'],
  'sign-in screen': [
    '@aria-label: [[auth.themeToggle.label]]',
    '@aria-label: [[auth.languageSwitcher.label]]',
    locale,
    'Acme',
    '[[auth.login.title]]',
    '[[auth.login.subtitle]]',
    '[[auth.login.emailLabel]]',
    '[[auth.login.passwordLabel]]',
    '@aria-label: [[auth.login.showPassword]]',
    '[[auth.login.cta]]'
  ]
})

const RECORD: RecordType = {
  [LanguageEnum.EN]: recordIn({ locale: LanguageEnum.EN }),
  [LanguageEnum.ES]: recordIn({ locale: LanguageEnum.ES })
}

const BRAND = 'Acme'
const ARGUMENT = /\{(\w+)\}/g
const TOKEN = /\[\[([^\]|]+)((?:\|[^\]|]+)*)\]\]/g
const LABELS = ['aria-label', 'placeholder', 'alt', 'title']
const TEXT_NODE_NAME = '#text'

/** Every message replaced by its key and its arguments: `[[key|name={name}]]`. */
const toKeyMessages = ({
  messages,
  prefix
}: {
  messages: Record<string, unknown>
  prefix: string
}): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(messages).map(([name, value]) => {
      const path = prefix === '' ? name : `${prefix}.${name}`
      if (typeof value !== 'string') {
        return [
          name,
          toKeyMessages({
            messages: value as Record<string, unknown>,
            prefix: path
          })
        ]
      }
      const args = [
        ...new Set([...value.matchAll(ARGUMENT)].map((m) => m[1]))
      ]
      return [
        name,
        `[[${[path, ...args.map((arg) => `${arg}={${arg}}`)].join('|')}]]`
      ]
    })
  )

/** The catalog with the brand pinned, or with every message its own key. */
const toCatalog = ({
  asKeys,
  locale
}: {
  asKeys: boolean
  locale: SupportedLanguageType
}): CatalogType => {
  const messages = resources[locale].translation
  const shown = asKeys
    ? (toKeyMessages({
        messages: messages as unknown as Record<string, unknown>,
        prefix: ''
      }) as unknown as CatalogType)
    : messages
  return { ...shown, app: { ...shown.app, name: BRAND } }
}

/** A recorded line with every message in the catalog's copy. */
const expandLine = ({
  catalog,
  line
}: {
  catalog: CatalogType
  line: string
}): string =>
  line.replace(TOKEN, (...[, path = '', args = '']: string[]) => {
    const message = path
      .split('.')
      .reduce<unknown>(
        (node, segment) => (node as Record<string, unknown>)[segment],
        catalog
      ) as string
    const values = new Map(
      args
        .split('|')
        .filter((pair) => pair !== '')
        .map((pair) => pair.split('=') as [string, string])
    )
    return message.replace(
      ARGUMENT,
      (...[, arg = '']: string[]) => values.get(arg) ?? ''
    )
  })

/** Every text and accessible label under a node, in document order. */
const readLines = (node: IDomNode): string[] => {
  if (node.nodeName === TEXT_NODE_NAME) {
    const text = node.textContent?.trim() ?? ''
    return text === '' ? [] : [text]
  }
  const labels = LABELS.flatMap((label) => {
    const value = node.getAttribute?.(label)
    return value === null || value === undefined
      ? []
      : [`@${label}: ${value}`]
  })
  return [...labels, ...Array.from(node.childNodes).flatMap(readLines)]
}

// The React Native types carry no DOM, so the document is reached by shape.
const readVisibleText = (): string[] =>
  readLines(
    (globalThis as unknown as { document: { body: IDomNode } }).document
      .body
  )

const renderSample = ({
  language,
  messages,
  sample
}: {
  language: SupportedLanguageType
  messages: CatalogType
  sample: ISample
}): string[] => {
  const view = renderWithI18n({ language, messages, ui: sample.ui() })
  const lines = readVisibleText()
  view.unmount()
  return lines
}

describe('renderWithI18n', () => {
  test('every sample shows the messages it showed at the base, in both languages', () => {
    SUPPORTED_LANGUAGES.forEach((language) => {
      const keyCatalog = toCatalog({ asKeys: true, locale: language })
      SAMPLES.forEach((sample) => {
        expect(
          renderSample({ language, messages: keyCatalog, sample }),
          `${sample.name} in ${language}`
        ).toEqual(RECORD[language][sample.name])
      })
    })
  })

  test('every sample shows the copy its catalog holds, in both languages', () => {
    SUPPORTED_LANGUAGES.forEach((language) => {
      const catalog = toCatalog({ asKeys: false, locale: language })
      SAMPLES.forEach((sample) => {
        expect(
          renderSample({ language, messages: catalog, sample }),
          `${sample.name} in ${language}`
        ).toEqual(
          (RECORD[language][sample.name] ?? []).map((line) =>
            expandLine({ catalog, line })
          )
        )
      })
    })
  })
})
