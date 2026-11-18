import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import type { ComponentType } from 'react'
import { Text } from 'react-native'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import { AsyncBoundary } from '@/components/ui/AsyncBoundary/AsyncBoundary.component'
import type {
  IAsyncBoundaryFallbackProps,
  IAsyncBoundaryProps
} from '@/components/ui/AsyncBoundary/AsyncBoundary.type'
import { AsyncBoundaryDefaultError } from '@/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component'
import { renderWithI18n } from '@/test/i18n.helper'
import { fireEvent, screen, within } from '@/test/test.helper'

const english = resources[DEFAULT_LANGUAGE].translation

describe('AsyncBoundary (mobile)', () => {
  test('module exports AsyncBoundary as a function', () => {
    expect(typeof AsyncBoundary).toBe('function')
  })

  test('renders its error fallback with the thrown error, and its children again after a reset', () => {
    // React reports the error the boundary catches; the test reads the fallback instead.
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const child = { throws: true }
    const Child = () => {
      if (child.throws) throw new Error('Load failed')
      return <Text>Loaded content</Text>
    }

    renderWithI18n({
      language: DEFAULT_LANGUAGE,
      ui: (
        <AsyncBoundary ErrorFallback={AsyncBoundaryDefaultError}>
          <Child />
        </AsyncBoundary>
      )
    })
    expect(
      within(screen.getByRole('alert')).getByText('Load failed')
    ).toBeTruthy()
    child.throws = false
    fireEvent.click(
      screen.getByRole('button', { name: english.common.retry })
    )

    expect(screen.getByText('Loaded content')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    consoleError.mockRestore()
  })

  test('types its error fallback with its own props', () => {
    expectTypeOf<IAsyncBoundaryProps['ErrorFallback']>().toEqualTypeOf<
      ComponentType<IAsyncBoundaryFallbackProps> | undefined
    >()
    expectTypeOf<IAsyncBoundaryFallbackProps>().toEqualTypeOf<{
      error: unknown
      resetErrorBoundary: () => void
    }>()
  })
})
