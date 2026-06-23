import { describe, expect, test, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { Button } from '@/components/ui/Button/Button.component'
import { render, screen } from '@/test/test.helper'

describe('Button', () => {
  test('renders its children as the accessible label', () => {
    render(<Button>Save</Button>)
    expect(
      screen.getByRole('button', { name: 'Save' })
    ).toBeInTheDocument()
  })

  test('has no accessibility violations', async () => {
    const { container } = render(<Button>Save</Button>)
    expect(await axe(container)).toHaveNoViolations()
  })

  test('shows a loading indicator and marks aria-busy when loading', () => {
    render(<Button isLoading>Save</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  test('fires onClick when pressed', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    screen.getByRole('button').click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>
    )
    screen.getByRole('button').click()
    expect(onClick).not.toHaveBeenCalled()
  })
})
