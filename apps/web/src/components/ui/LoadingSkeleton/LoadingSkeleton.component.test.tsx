import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.component'

describe('LoadingSkeleton', () => {
  test('renders with role=status', () => {
    render(<LoadingSkeleton />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  test('is marked aria-busy', () => {
    render(<LoadingSkeleton />)
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe(
      'true'
    )
  })

  test('applies rounded-full variant class', () => {
    render(<LoadingSkeleton rounded="full" />)
    const el = screen.getByRole('status')
    expect(el.className).toContain('rounded-full')
  })

  test('applies custom dimensions via style', () => {
    render(<LoadingSkeleton height="40px" width="200px" />)
    const el = screen.getByRole('status')
    expect(el.style.height).toBe('40px')
    expect(el.style.width).toBe('200px')
  })
})
