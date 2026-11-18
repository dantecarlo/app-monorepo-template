import {
  type ILocaleResources,
  LanguageEnum,
  resources,
  SUPPORTED_LANGUAGES,
  type SupportedLanguageType
} from '@app/i18n'
import { createTranslator } from 'next-intl'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { AppQueryProvider } from '@/lib/query/AppQueryProvider.component'
import { createTestQueryClient } from '@/test/query.helper'

// The visible text of a sample of screens and blocks, in both languages,
// against the record taken at 571d25b, before the i18n seam moved every
// import of next-intl behind lib/i18n. The record names the catalog message
// behind each piece of text, so it holds no copy of either language and
// survives a copy change: a sample rendered with a catalog whose every value
// is its own key must equal it, and rendered with the real catalog must show
// those messages in that catalog's copy. The app name is the brand, the same
// in every catalog and rewritten by /init, so both renders pin it to BRAND.

const intl = vi.hoisted(() => ({
  locale: 'en',
  messages: {} as Record<string, unknown>
}))

vi.mock('next-intl/server', () => ({
  getLocale: async () => intl.locale,
  getMessages: async () => intl.messages,
  getTranslations: async (namespace?: string) =>
    createTranslator({
      locale: intl.locale,
      messages: intl.messages,
      namespace
    })
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() })
}))

vi.mock('@/components/ui/Image/Image.component', () => ({
  Image: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={src} />
  )
}))

vi.mock('@/lib/supabase/authGateway.adapter', () => ({
  getAuthGateway: () => ({ signIn: vi.fn() })
}))

vi.mock('@/components/ThemeProvider/useTheme.hook', () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: 'dark' })
}))

vi.mock('@/screens/ItemsSummary/loadItemsSummary.service', () => ({
  loadItemsSummary: async () => ({
    activeCount: 3,
    archivedCount: 1,
    draftCount: 2,
    totalCount: 6
  })
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
import ItemsSummaryScreen from '@/screens/ItemsSummary/ItemsSummary.screen'
import { LoginScreen } from '@/screens/Login/Login.screen'
import { renderWithIntl } from '@/test/intl.helper'

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
  render: () => Promise<ReactElement>
}

const noop = () => undefined

const withQueryClient = (ui: ReactElement) => (
  <AppQueryProvider client={createTestQueryClient()}>
    {ui}
  </AppQueryProvider>
)

const SAMPLES: ISample[] = [
  {
    name: 'sign-in screen',
    render: async () => withQueryClient(<LoginScreen />)
  },
  {
    name: 'items dashboard',
    render: async () => withQueryClient(<ItemsDashboardScreen />)
  },
  { name: 'items summary', render: () => ItemsSummaryScreen() },
  {
    name: 'error state by code',
    render: async () => (
      <ErrorState code={ErrorStateCodeEnum.NOT_FOUND} onRetry={noop} />
    )
  },
  {
    name: 'error state',
    render: async () => <ErrorState onRetry={noop} />
  },
  { name: 'empty state', render: async () => <EmptyState /> },
  {
    name: 'confirmation',
    render: async () => (
      <ConfirmDialog
        isOpen
        message="Delete the draft?"
        onCancel={noop}
        onConfirm={noop}
      />
    )
  },
  {
    name: 'offline banner',
    render: async () => <OfflineBanner forceOffline />
  }
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
    'Delete the draft?',
    '[[common.cancel]]',
    '[[common.confirm]]'
  ],
  'empty state': [
    '[[components.emptyState.title]]',
    '[[components.emptyState.message]]'
  ],
  'error state': [
    '[[components.errorState.title]]',
    '[[components.errorState.message]]',
    '[[components.errorState.retry]]'
  ],
  'error state by code': [
    '[[components.errorState.byCode.404.title]]',
    '[[components.errorState.byCode.404.message]]',
    '[[components.errorState.retry]]'
  ],
  'items dashboard': [
    '@aria-label: Acme',
    'A',
    '[[items.dashboard.welcomeBack]]',
    '[[items.dashboard.title]]',
    '@aria-label: [[items.dashboard.settingsLabel]]',
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
    '@aria-label: [[items.dashboard.searchLabel]]',
    '@placeholder: [[items.dashboard.searchPlaceholder]]',
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
    '[[items.dashboard.viewAll]]',
    '@aria-label: [[items.dashboard.nav.ariaLabel]]',
    '[[items.dashboard.nav.home]]',
    '[[items.dashboard.nav.items]]',
    '[[items.dashboard.nav.search]]',
    '[[items.dashboard.nav.settings]]'
  ],
  'items summary': [
    '[[items.summary.title]]',
    '6',
    '[[items.summary.total]]',
    '3',
    '[[items.summary.active]]',
    '2',
    '[[items.summary.draft]]',
    '1',
    '[[items.summary.archived]]'
  ],
  'offline banner': ['[[helper.offline.message]]'],
  'sign-in screen': [
    '@aria-label: [[auth.themeToggle.label]]',
    '@aria-label: [[auth.languageSwitcher.label]]',
    locale,
    '@alt: [[auth.logo.label|name=Acme]]',
    'Acme',
    '[[auth.login.title]]',
    '[[auth.login.subtitle]]',
    '[[auth.login.emailLabel]]',
    '@placeholder: [[auth.login.emailPlaceholder]]',
    '[[auth.login.passwordLabel]]',
    '@placeholder: [[auth.login.passwordPlaceholder]]',
    '@aria-label: [[auth.login.showPassword]]',
    '[[auth.login.cta]]',
    '[[auth.login.dividerOr]]',
    '[[auth.login.googleCta]]'
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

const readVisibleText = (): string[] =>
  readLines(document.body as unknown as IDomNode)

const renderSample = async ({
  locale,
  messages,
  sample
}: {
  locale: SupportedLanguageType
  messages: CatalogType
  sample: ISample
}): Promise<string[]> => {
  intl.locale = locale
  intl.messages = messages as unknown as Record<string, unknown>
  const view = renderWithIntl({
    locale,
    messages,
    ui: await sample.render()
  })
  const lines = readVisibleText()
  view.unmount()
  return lines
}

describe('renderWithIntl', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      now: new Date('2026-11-18T12:00:00.000Z'),
      toFake: ['Date']
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('every sample shows the messages it showed at the base, in both languages', async () => {
    for (const locale of SUPPORTED_LANGUAGES) {
      const keyCatalog = toCatalog({ asKeys: true, locale })
      for (const sample of SAMPLES) {
        expect(
          await renderSample({ locale, messages: keyCatalog, sample }),
          `${sample.name} in ${locale}`
        ).toEqual(RECORD[locale][sample.name])
      }
    }
  })

  test('every sample shows the copy its catalog holds, in both languages', async () => {
    for (const locale of SUPPORTED_LANGUAGES) {
      const catalog = toCatalog({ asKeys: false, locale })
      for (const sample of SAMPLES) {
        expect(
          await renderSample({ locale, messages: catalog, sample }),
          `${sample.name} in ${locale}`
        ).toEqual(
          (RECORD[locale][sample.name] ?? []).map((line) =>
            expandLine({ catalog, line })
          )
        )
      }
    }
  })
})
