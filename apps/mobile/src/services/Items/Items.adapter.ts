import type {
  IItemAge,
  IItemDto,
  IItemViewModel
} from '@/screens/ItemsDashboard/models/Item.type'
import {
  HOURS_PER_DAY,
  ItemAgeUnitEnum,
  MINUTES_PER_HOUR,
  MS_PER_MINUTE
} from '@/services/Items/items.constant'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

// The age is a unit and a count, never a sentence: the card words it in the
// active language through the items.age messages.
const toItemAge = (isoString: string): IItemAge => {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMins = Math.floor(diffMs / MS_PER_MINUTE)

  if (diffMins < 1) return { count: 0, unit: ItemAgeUnitEnum.JUST_NOW }
  if (diffMins < MINUTES_PER_HOUR) {
    return { count: diffMins, unit: ItemAgeUnitEnum.MINUTES }
  }

  const diffHours = Math.floor(diffMins / MINUTES_PER_HOUR)
  if (diffHours < HOURS_PER_DAY) {
    return { count: diffHours, unit: ItemAgeUnitEnum.HOURS }
  }

  return {
    count: Math.floor(diffHours / HOURS_PER_DAY),
    unit: ItemAgeUnitEnum.DAYS
  }
}

// ---------------------------------------------------------------------------
// Adapter — maps IItemDto → IItemViewModel
// ---------------------------------------------------------------------------

export const adaptItem = (dto: IItemDto): IItemViewModel => ({
  age: toItemAge(dto.created_at),
  authorInitials: dto.author_name ? toInitials(dto.author_name) : '?',
  authorLabel: dto.author_name ?? '',
  category: dto.category,
  createdAt: new Date(dto.created_at),
  description: dto.description,
  id: dto.id,
  status: dto.status,
  title: dto.title
})

export const adaptItems = (dtos: IItemDto[]): IItemViewModel[] =>
  dtos.map(adaptItem)
