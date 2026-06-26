import { describe, expect, test, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock the domain service the loader composes. The loader is a thin server-side
// data seam; we assert it forwards the cached summary view model unchanged.
// The fixture lives inside vi.hoisted so it is available to the hoisted
// vi.mock factory (top-level consts are hoisted below the factory).
// ---------------------------------------------------------------------------

const { mockSummary } = vi.hoisted(() => ({
  mockSummary: {
    activeCount: 1,
    archivedCount: 1,
    draftCount: 1,
    totalCount: 3
  }
}))

vi.mock('@/services/ItemsSummary', () => ({
  getItemsSummary: vi.fn().mockResolvedValue(mockSummary)
}))

import { loadItemsSummary } from '@/screens/ItemsSummary/loadItemsSummary.service'

describe('loadItemsSummary', () => {
  test('returns the summary view model from the domain service', async () => {
    const vm = await loadItemsSummary()
    expect(vm).toEqual(mockSummary)
  })
})
