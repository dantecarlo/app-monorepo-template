import { fireEvent, render, screen } from '@testing-library/react'
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

  test('calls onChangeText when user types', () => {
    const onChangeText = vi.fn()
    render(
      <SearchBar
        accessibilityLabel="Buscar"
        onChangeText={onChangeText}
        value=""
      />
    )
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'abc' } })
    expect(onChangeText).toHaveBeenCalledWith('abc')
  })

  test('is exported as a function', () => {
    expect(typeof SearchBar).toBe('function')
  })
})
