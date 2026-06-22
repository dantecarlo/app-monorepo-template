import type { ItemDto } from '@/features/items/models/Item.type';

// ---------------------------------------------------------------------------
// Mock data — replace with your API / Supabase calls when ready.
//
// TODO: swap with something like:
//   const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false })
// ---------------------------------------------------------------------------

const NOW = new Date();
const t = (hoursAgo: number) =>
  new Date(NOW.getTime() - hoursAgo * 3_600_000).toISOString();

const MOCK_ITEMS: ItemDto[] = [
  {
    id: 'item_001',
    title: 'Improve onboarding flow',
    description: 'Streamline the first-run experience with a step-by-step wizard.',
    category: 'UX',
    status: 'active',
    created_at: t(1),
    updated_at: t(0.5),
    author_id: 'usr_1',
    author_name: 'Alice Brown',
  },
  {
    id: 'item_002',
    title: 'Add dark mode support',
    description: 'Implement a system-aware theme toggle using CSS variables.',
    category: 'Frontend',
    status: 'active',
    created_at: t(3),
    updated_at: t(2),
    author_id: 'usr_2',
    author_name: 'Bob Carter',
  },
  {
    id: 'item_003',
    title: 'Set up CI/CD pipeline',
    description: 'GitHub Actions workflow for automated tests and deploys.',
    category: 'DevOps',
    status: 'active',
    created_at: t(8),
    updated_at: t(6),
    author_id: 'usr_1',
    author_name: 'Alice Brown',
  },
  {
    id: 'item_004',
    title: 'Migrate to App Router',
    description: 'Move from Pages Router to Next.js App Router with RSC.',
    category: 'Architecture',
    status: 'archived',
    created_at: t(48),
    updated_at: t(24),
    author_id: null,
    author_name: null,
  },
  {
    id: 'item_005',
    title: 'Write API documentation',
    description: 'Document all public endpoints with OpenAPI 3.1 spec.',
    category: 'Docs',
    status: 'draft',
    created_at: t(72),
    updated_at: t(72),
    author_id: 'usr_3',
    author_name: 'Carol Davis',
  },
];

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export interface GetItemsParams {
  limit?: number;
  search?: string;
}

/**
 * Fetches items — mock implementation.
 * Replace with a real fetch / Supabase query.
 */
export async function getItems({ limit = 50, search }: GetItemsParams): Promise<ItemDto[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  let results = MOCK_ITEMS;

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }

  return results.slice(0, limit);
}

export interface GetItemParams {
  itemId: string;
}

export async function getItem({ itemId }: GetItemParams): Promise<ItemDto | null> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return MOCK_ITEMS.find((item) => item.id === itemId) ?? null;
}
