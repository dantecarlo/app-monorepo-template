import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import type { ComponentType } from 'react'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { AsyncBoundary } from '@/components/ui/AsyncBoundary/AsyncBoundary.component'
import type {
  IAsyncBoundaryFallbackProps,
  IAsyncBoundaryProps
} from '@/components/ui/AsyncBoundary/AsyncBoundary.type'
import { AsyncBoundaryDefaultError } from '@/components/ui/AsyncBoundary/AsyncBoundaryDefaultError.component'
import { renderWithIntl } from '@/test/intl.helper'
import { fireEvent, render, screen } from '@/test/test.helper'

const english = resources[DEFAULT_LANGUAGE].translation

describe('AsyncBoundary', () => {
  test('renders its children when nothing suspends or throws', () => {
    render(
      <AsyncBoundary>
        <p>Loaded content</p>
      </AsyncBoundary>
    )
    expect(screen.getByText('Loaded content')).toBeInTheDocument()
  })

  test('has no accessibility violations', async () => {
    const { container } = render(
      <AsyncBoundary>
        <p>Loaded content</p>
      </AsyncBoundary>
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  test('renders its error fallback with the thrown error, and its children again after a reset', () => {
    // React reports the error the boundary catches; the test reads the fallback instead.
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const child = { throws: true }
    const Child = () => {
      if (child.throws) throw new Error('Load failed')
      return <p>Loaded content</p>
    }

    renderWithIntl({
      ui: (
        <AsyncBoundary ErrorFallback={AsyncBoundaryDefaultError}>
          <Child />
        </AsyncBoundary>
      )
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Load failed')
    child.throws = false
    fireEvent.click(
      screen.getByRole('button', { name: english.common.retry })
    )

    expect(screen.getByText('Loaded content')).toBeInTheDocument()
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
