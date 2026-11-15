import { DEFAULT_LANGUAGE, resources } from '@app/i18n'
import { describe, expect, test, vi } from 'vitest'

import GlobalError from '@/app/global-error'
import { render, screen } from '@/test/test.helper'

const errorStateCopy =
  resources[DEFAULT_LANGUAGE].translation.components.errorState

describe('GlobalError', () => {
  test('renders the generic error state in its own document', () => {
    render(
      <GlobalError
        error={new Error('layout failed')}
        reset={vi.fn()}
        unstable_retry={vi.fn()}
      />,
      { container: document }
    )

    expect(document.documentElement).toHaveAttribute(
      'lang',
      DEFAULT_LANGUAGE
    )
    const alert = screen.getByRole('alert')
    expect(document.body).toContainElement(alert)
    expect(alert).toHaveTextContent(errorStateCopy.title)
    expect(alert).toHaveTextContent(errorStateCopy.message)
  })
})
