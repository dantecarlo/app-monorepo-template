import { DEFAULT_LANGUAGE, LanguageEnum, resources } from '@app/i18n'
import { describe, expect, test, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { Button } from '@/components/ui/Button/Button.component'
import { renderWithIntl } from '@/test/intl.helper'
import { screen } from '@/test/test.helper'

describe('Button', () => {
  test('renders its children as the accessible label', () => {
    renderWithIntl({ ui: <Button>Save</Button> })
    expect(
      screen.getByRole('button', { name: 'Save' })
    ).toBeInTheDocument()
  })

  test('has no accessibility violations', async () => {
    const { container } = renderWithIntl({ ui: <Button>Save</Button> })
    expect(await axe(container)).toHaveNoViolations()
  })

  test('shows a loading indicator and marks aria-busy when loading', () => {
    renderWithIntl({ ui: <Button isLoading>Save</Button> })
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
    expect(
      screen.getByText(
        resources[DEFAULT_LANGUAGE].translation.common.loading
      )
    ).toBeInTheDocument()
  })

  test('fires onClick when pressed', () => {
    const onClick = vi.fn()
    renderWithIntl({ ui: <Button onClick={onClick}>Save</Button> })
    screen.getByRole('button').click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('keeps its token font size beside its text colour', () => {
    renderWithIntl({ ui: <Button>Save</Button> })

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass(
      'text-button',
      'text-accent-ink'
    )
  })

  test('takes the font size of its size variant', () => {
    renderWithIntl({ ui: <Button size="lg">Save</Button> })
    const button = screen.getByRole('button', { name: 'Save' })

    expect(button).toHaveClass('text-heading', 'text-accent-ink')
    expect(button).not.toHaveClass('text-button')
  })

  test('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    renderWithIntl({
      ui: (
        <Button disabled onClick={onClick}>
          Save
        </Button>
      )
    })
    screen.getByRole('button').click()
    expect(onClick).not.toHaveBeenCalled()
  })

  test('labels its loading indicator in the active language', () => {
    renderWithIntl({
      locale: LanguageEnum.ES,
      ui: <Button isLoading>Save</Button>
    })

    expect(
      screen.getByText(
        resources[LanguageEnum.ES].translation.common.loading
      )
    ).toBeInTheDocument()
  })
})
