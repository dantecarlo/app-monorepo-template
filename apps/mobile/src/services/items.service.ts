import type { IItemDto } from '@/screens/ItemsDashboard/models/Item.type'

// ---------------------------------------------------------------------------
// Mock data — replace with your API / Supabase calls when ready.
//
// TODO: swap with something like:
//   const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false })
// ---------------------------------------------------------------------------

const NOW = new Date()
const t = (hoursAgo: number) =>
  new Date(NOW.getTime() - hoursAgo * 3_600_000).toISOString()

const MOCK_ITEMS: IItemDto[] = [
  {
    author_id: 'usr_1',
    author_name: 'Alice Brown',
    category: 'UX',
    created_at: t(1),
    description:
      'Streamline the first-run experience with a step-by-step wizard.',
    id: 'item_001',
    status: 'active',
    title: 'Improve onboarding flow',
    updated_at: t(0.5)
  },
  {
    author_id: 'usr_2',
    author_name: 'Bob Carter',
    category: 'Frontend',
    created_at: t(3),
    description:
      'Implement a system-aware theme toggle using CSS variables.',
    id: 'item_002',
    status: 'active',
    title: 'Add dark mode support',
    updated_at: t(2)
  },
  {
    author_id: 'usr_1',
    author_name: 'Alice Brown',
    category: 'DevOps',
    created_at: t(8),
    description:
      'GitHub Actions workflow for automated tests and deploys.',
    id: 'item_003',
    status: 'active',
    title: 'Set up CI/CD pipeline',
    updated_at: t(6)
  },
  {
    author_id: null,
    author_name: null,
    category: 'Architecture',
    created_at: t(48),
    description: 'Move from Pages Router to Next.js App Router with RSC.',
    id: 'item_004',
    status: 'archived',
    title: 'Migrate to App Router',
    updated_at: t(24)
  },
  {
    author_id: 'usr_3',
    author_name: 'Carol Davis',
    category: 'Docs',
    created_at: t(72),
    description: 'Document all public endpoints with OpenAPI 3.1 spec.',
    id: 'item_005',
    status: 'draft',
    title: 'Write API documentation',
    updated_at: t(72)
  }
]

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export interface IGetItemsParams {
  limit?: number
  search?: string
}

/**
 * Fetches items — mock implementation.
 * Replace with a real fetch / Supabase query.
 */
export const getItems = async ({
  limit = 50,
  search
}: IGetItemsParams): Promise<IItemDto[]> => {
  await new Promise((resolve) => setTimeout(resolve, 250))

  let results = MOCK_ITEMS

  if (search) {
    const q = search.toLowerCase()
    results = results.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }

  return results.slice(0, limit)
}

export interface IGetItemParams {
  itemId: string
}

export const getItem = async ({
  itemId
}: IGetItemParams): Promise<IItemDto | null> => {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return MOCK_ITEMS.find((item) => item.id === itemId) ?? null
}
