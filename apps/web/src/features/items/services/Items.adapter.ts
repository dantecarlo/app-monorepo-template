import type { ItemDto, ItemViewModel } from '@/features/items/models/Item.type';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function toRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// ---------------------------------------------------------------------------
// Adapter — maps ItemDto → ItemViewModel
// ---------------------------------------------------------------------------

export function adaptItem(dto: ItemDto): ItemViewModel {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    category: dto.category,
    status: dto.status,
    timeDisplay: toRelativeTime(dto.created_at),
    authorLabel: dto.author_name ?? '',
    authorInitials: dto.author_name ? toInitials(dto.author_name) : '?',
    createdAt: new Date(dto.created_at),
  };
}

/**
 * Adapts an array of DTOs.
 * Curried form is useful as a TanStack Query `select` function.
 */
export function adaptItems(dtos: ItemDto[]): ItemViewModel[] {
  return dtos.map(adaptItem);
}
