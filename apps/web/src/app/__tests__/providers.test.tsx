import type { IAuthGateway } from '@app/core'
import {
  DEFAULT_LANGUAGE,
  LanguageEnum,
  resources,
  type SupportedLanguageType
} from '@app/i18n'
import { afterEach, describe, expect, test, vi } from 'vitest'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, replace: vi.fn() })
}))

// The request config reads the cookie through next/headers; here it reads
// the cookie the language button writes to the document.
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const entry = document.cookie
        .split('; ')
        .map((pair) => pair.split('='))
        .find(([key]) => key === name)
      return entry ? { value: entry[1] } : undefined
    }
  })
}))

vi.mock('next-intl/server', () => ({
  getRequestConfig: (factory: unknown) => factory
}))

import { Providers } from '@/app/providers'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { LOCALE_COOKIE_NAME } from '@/i18n/i18n.constant'
import { useToastStore } from '@/stores/toast.store'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from '@/test/test.helper'

interface IRequestConfigType {
  locale: SupportedLanguageType
  messages: (typeof resources)[SupportedLanguageType]['translation']
}

type RequestConfigFactoryType = (args: {
  requestLocale: Promise<string | undefined>
}) => Promise<IRequestConfigType>

const makeGateway = (): IAuthGateway => ({
  getSession: vi.fn().mockResolvedValue(null),
  onAuthStateChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  signIn: vi.fn(),
  signOut: vi.fn()
})

const english = resources[LanguageEnum.EN].translation
const spanish = resources[LanguageEnum.ES].translation

const languageButton = (label: string) =>
  screen.getByRole('button', { name: label })

describe('Providers', () => {
  afterEach(() => {
    useToastStore.getState().clear()
    document.cookie = `${LOCALE_COOKIE_NAME}=;path=/;max-age=0`
    document.documentElement.lang = DEFAULT_LANGUAGE
    refresh.mockReset()
  })

  test('shows a queued error toast and removes it when Dismiss is pressed', () => {
    render(
      <Providers
        gateway={makeGateway()}
        locale={DEFAULT_LANGUAGE}
        messages={resources[DEFAULT_LANGUAGE].translation}
      >
        <p>Page</p>
      </Providers>
    )

    act(() => {
      useToastStore
        .getState()
        .add({ message: 'Could not save the item', variant: 'error' })
    })
    expect(screen.getByRole('status')).toHaveTextContent(
      'Could not save the item'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(
      screen.queryByText('Could not save the item')
    ).not.toBeInTheDocument()
  })

  test('renders client components in the locale it is given and sets the document language', () => {
    render(
      <Providers
        gateway={makeGateway()}
        locale={LanguageEnum.ES}
        messages={spanish}
      >
        <LanguageSwitcher />
      </Providers>
    )

    expect(
      languageButton(spanish.auth.languageSwitcher.label)
    ).toHaveTextContent(LanguageEnum.ES)
    expect(document.documentElement).toHaveAttribute(
      'lang',
      LanguageEnum.ES
    )
  })

  test('switches the client components to the next language and back', async () => {
    const requestConfig = (await import('@/i18n/request.config'))
      .default as unknown as RequestConfigFactoryType
    const resolveRequest = () =>
      requestConfig({ requestLocale: Promise.resolve(undefined) })
    const page = ({ locale, messages }: IRequestConfigType) => (
      <Providers
        gateway={makeGateway()}
        locale={locale}
        messages={messages}
      >
        <LanguageSwitcher />
      </Providers>
    )

    const view = render(page(await resolveRequest()))
    // A router refresh renders the route again on the server, which runs the
    // request config on the cookie and hands its result to the providers.
    refresh.mockImplementation(async () => {
      view.rerender(page(await resolveRequest()))
    })
    expect(
      languageButton(english.auth.languageSwitcher.label)
    ).toHaveTextContent(LanguageEnum.EN)

    fireEvent.click(languageButton(english.auth.languageSwitcher.label))

    await waitFor(() =>
      expect(
        languageButton(spanish.auth.languageSwitcher.label)
      ).toHaveTextContent(LanguageEnum.ES)
    )
    expect(document.documentElement).toHaveAttribute(
      'lang',
      LanguageEnum.ES
    )

    fireEvent.click(languageButton(spanish.auth.languageSwitcher.label))

    await waitFor(() =>
      expect(
        languageButton(english.auth.languageSwitcher.label)
      ).toHaveTextContent(LanguageEnum.EN)
    )
    expect(document.documentElement).toHaveAttribute(
      'lang',
      LanguageEnum.EN
    )
    expect(refresh).toHaveBeenCalledTimes(2)
  })
})
