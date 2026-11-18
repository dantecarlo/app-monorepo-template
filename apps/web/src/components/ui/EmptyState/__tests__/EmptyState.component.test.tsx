import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { EmptyState } from '@/components/ui/EmptyState/EmptyState.component'
import { AppI18nProvider } from '@/lib/i18n/AppI18nProvider.component'
import { withCopy } from '@/test/intl.helper'

const messages = {
  components: {
    emptyState: {
      message: 'There is nothing here yet.',
      title: 'No results'
    }
  }
}

const renderEmptyState = (
  props: Partial<React.ComponentProps<typeof EmptyState>> = {}
) =>
  render(
    <AppI18nProvider locale="en" messages={withCopy({ copy: messages })}>
      <EmptyState {...props} />
    </AppI18nProvider>
  )

describe('EmptyState', () => {
  test('renders default i18n title and message', () => {
    renderEmptyState()
    expect(screen.getByText('No results')).toBeTruthy()
    expect(screen.getByText('There is nothing here yet.')).toBeTruthy()
  })

  test('renders custom title and message', () => {
    renderEmptyState({ message: 'Custom message', title: 'Custom Title' })
    expect(screen.getByText('Custom Title')).toBeTruthy()
    expect(screen.getByText('Custom message')).toBeTruthy()
  })

  test('renders cta slot when provided', () => {
    renderEmptyState({ cta: <button type="button">Add item</button> })
    expect(screen.getByRole('button', { name: 'Add item' })).toBeTruthy()
  })
})
