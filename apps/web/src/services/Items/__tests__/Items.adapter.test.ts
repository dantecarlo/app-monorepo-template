import { afterEach, describe, expect, test, vi } from 'vitest'

import type { IItemDto } from '@/screens/ItemsDashboard/models/Item.type'
import { adaptItem, adaptItems } from '@/services/Items/Items.adapter'
import {
  HOURS_PER_DAY,
  ItemAgeUnitEnum,
  MS_PER_HOUR,
  MS_PER_MINUTE
} from '@/services/Items/items.constant'

const NOW = new Date('2026-06-22T12:00:00.000Z')

const AGE = { DAYS: 3, HOURS: 5, MINUTES: 40, SECONDS_MS: 30_000 } as const

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeDto = (overrides: Partial<IItemDto> = {}): IItemDto => ({
  author_id: 'usr_1',
  author_name: 'Alice Brown',
  category: 'UX',
  created_at: '2026-06-22T10:00:00.000Z',
  description: 'A sample description.',
  id: 'item_001',
  status: 'active',
  title: 'Improve onboarding flow',
  updated_at: '2026-06-22T10:30:00.000Z',
  ...overrides
})

// ---------------------------------------------------------------------------
// adaptItem — single DTO
// ---------------------------------------------------------------------------

describe('adaptItem', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('maps the title and description straight through', () => {
    const vm = adaptItem(makeDto())
    expect(vm.title).toBe('Improve onboarding flow')
    expect(vm.description).toBe('A sample description.')
  })

  test('parses created_at into a Date', () => {
    const vm = adaptItem(
      makeDto({ created_at: '2026-06-22T10:00:00.000Z' })
    )
    expect(vm.createdAt).toBeInstanceOf(Date)
    expect(vm.createdAt.getUTCFullYear()).toBe(2026)
  })

  test('builds initials from a two-word author name', () => {
    const vm = adaptItem(makeDto({ author_name: 'Alice Brown' }))
    expect(vm.authorInitials).toBe('AB')
  })

  test('builds initials from a single-word author name (null-guard)', () => {
    const vm = adaptItem(makeDto({ author_name: 'Mononymous' }))
    expect(vm.authorInitials).toBe('M')
  })

  test('collapses extra whitespace when building initials (null-guard)', () => {
    const vm = adaptItem(makeDto({ author_name: '  Mary  Ann  Smith ' }))
    expect(vm.authorInitials).toBe('MA')
  })

  test('falls back to "?" initials when author_name is null', () => {
    const vm = adaptItem(makeDto({ author_id: null, author_name: null }))
    expect(vm.authorInitials).toBe('?')
  })

  test('returns empty authorLabel when author_name is null (null-guard)', () => {
    const vm = adaptItem(makeDto({ author_id: null, author_name: null }))
    expect(vm.authorLabel).toBe('')
  })

  test('preserves the status', () => {
    expect(adaptItem(makeDto({ status: 'draft' })).status).toBe('draft')
    expect(adaptItem(makeDto({ status: 'archived' })).status).toBe(
      'archived'
    )
  })

  test('describes the age as a unit and a count', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    const ageOf = (msAgo: number) =>
      adaptItem(
        makeDto({
          created_at: new Date(NOW.getTime() - msAgo).toISOString()
        })
      ).age

    expect(ageOf(AGE.SECONDS_MS)).toEqual({
      count: 0,
      unit: ItemAgeUnitEnum.JUST_NOW
    })
    expect(ageOf(AGE.MINUTES * MS_PER_MINUTE)).toEqual({
      count: AGE.MINUTES,
      unit: ItemAgeUnitEnum.MINUTES
    })
    expect(ageOf(AGE.HOURS * MS_PER_HOUR)).toEqual({
      count: AGE.HOURS,
      unit: ItemAgeUnitEnum.HOURS
    })
    expect(ageOf(AGE.DAYS * HOURS_PER_DAY * MS_PER_HOUR)).toEqual({
      count: AGE.DAYS,
      unit: ItemAgeUnitEnum.DAYS
    })
  })
})

// ---------------------------------------------------------------------------
// adaptItems — array
// ---------------------------------------------------------------------------

describe('adaptItems', () => {
  test('returns an empty array for empty input', () => {
    expect(adaptItems([])).toEqual([])
  })

  test('maps all DTOs preserving order', () => {
    const dtos = [makeDto({ id: 'item_001' }), makeDto({ id: 'item_002' })]
    const vms = adaptItems(dtos)
    expect(vms).toHaveLength(2)
    expect(vms[0]?.id).toBe('item_001')
    expect(vms[1]?.id).toBe('item_002')
  })
})
