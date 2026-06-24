import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'

import { SearchBar } from '@/components/ui/SearchBar/SearchBar.component'

describe('SearchBar', () => {
  test('renders the input', () => {
    render(
      <SearchBar
        accessibilityLabel="Buscar"
        onChangeText={vi.fn()}
        value=""
      />
    )
    expect(screen.getByRole('searchbox')).toBeTruthy()
  })

  test('calls onChangeText when user types', async () => {
    const onChangeText = vi.fn()
    render(
      <SearchBar
        accessibilityLabel="Buscar"
        onChangeText={onChangeText}
        value=""
      />
    )
    const input = screen.getByRole('searchbox')
    await userEvent.type(input, 'abc')
    expect(onChangeText).toHaveBeenCalled()
  })

  test('is exported as a function', () => {
    expect(typeof SearchBar).toBe('function')
  })
})
