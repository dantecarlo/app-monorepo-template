import type {
  IItemDto,
  IItemViewModel
} from '@/features/items/models/Item.type'

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

const toRelativeTime = (isoString: string): string => {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMins = Math.floor(diffMs / 60_000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

// ---------------------------------------------------------------------------
// Adapter — maps IItemDto → IItemViewModel
// ---------------------------------------------------------------------------

export const adaptItem = (dto: IItemDto): IItemViewModel => ({
  authorInitials: dto.author_name ? toInitials(dto.author_name) : '?',
  authorLabel: dto.author_name ?? '',
  category: dto.category,
  createdAt: new Date(dto.created_at),
  description: dto.description,
  id: dto.id,
  status: dto.status,
  timeDisplay: toRelativeTime(dto.created_at),
  title: dto.title
})

/**
 * Adapts an array of DTOs.
 * Curried form is useful as a TanStack Query `select` function.
 */
export const adaptItems = (dtos: IItemDto[]): IItemViewModel[] =>
  dtos.map(adaptItem)
