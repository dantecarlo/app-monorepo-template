import type { IItemDto } from '@/screens/ItemsDashboard/models/Item.type'
import {
  DEFAULT_ITEMS_LIMIT,
  ITEM_FETCH_DELAY_MS,
  ITEMS_API_URL,
  LIST_FETCH_DELAY_MS,
  MOCK_HOURS_AGO,
  MS_PER_HOUR
} from '@/services/Items/items.constant'

// ---------------------------------------------------------------------------
// Mock data — replace with your API / Supabase calls when ready.
//
// TODO: swap with something like:
//   const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false })
// ---------------------------------------------------------------------------

const NOW = new Date()
const t = (hoursAgo: number) =>
  new Date(NOW.getTime() - hoursAgo * MS_PER_HOUR).toISOString()

const MOCK_ITEMS: IItemDto[] = [
  {
    author_id: 'usr_1',
    author_name: 'Alice Brown',
    category: 'UX',
    created_at: t(MOCK_HOURS_AGO.ONE),
    description:
      'Streamline the first-run experience with a step-by-step wizard.',
    id: 'item_001',
    status: 'active',
    title: 'Improve onboarding flow',
    updated_at: t(MOCK_HOURS_AGO.HALF)
  },
  {
    author_id: 'usr_2',
    author_name: 'Bob Carter',
    category: 'Frontend',
    created_at: t(MOCK_HOURS_AGO.THREE),
    description:
      'Implement a system-aware theme toggle using CSS variables.',
    id: 'item_002',
    status: 'active',
    title: 'Add dark mode support',
    updated_at: t(MOCK_HOURS_AGO.TWO)
  },
  {
    author_id: 'usr_1',
    author_name: 'Alice Brown',
    category: 'DevOps',
    created_at: t(MOCK_HOURS_AGO.EIGHT),
    description:
      'GitHub Actions workflow for automated tests and deploys.',
    id: 'item_003',
    status: 'active',
    title: 'Set up CI/CD pipeline',
    updated_at: t(MOCK_HOURS_AGO.SIX)
  },
  {
    author_id: null,
    author_name: null,
    category: 'Architecture',
    created_at: t(MOCK_HOURS_AGO.TWO_DAYS),
    description: 'Move from Pages Router to Next.js App Router with RSC.',
    id: 'item_004',
    status: 'archived',
    title: 'Migrate to App Router',
    updated_at: t(MOCK_HOURS_AGO.ONE_DAY)
  },
  {
    author_id: 'usr_3',
    author_name: 'Carol Davis',
    category: 'Docs',
    created_at: t(MOCK_HOURS_AGO.THREE_DAYS),
    description: 'Document all public endpoints with OpenAPI 3.1 spec.',
    id: 'item_005',
    status: 'draft',
    title: 'Write API documentation',
    updated_at: t(MOCK_HOURS_AGO.THREE_DAYS)
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
  limit = DEFAULT_ITEMS_LIMIT,
  search
}: IGetItemsParams): Promise<IItemDto[]> => {
  // Simulate async network call
  await new Promise((resolve) => setTimeout(resolve, LIST_FETCH_DELAY_MS))

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
  await new Promise((resolve) => setTimeout(resolve, ITEM_FETCH_DELAY_MS))
  return MOCK_ITEMS.find((item) => item.id === itemId) ?? null
}

// ---------------------------------------------------------------------------
// HTTP variant — real fetch against a backend endpoint.
//
// This is the shape to keep once you wire a real API: a thin service that
// performs the request and hands raw DTOs to the adapter. Tests intercept the
// request with MSW (see src/test/mocks/handlers.ts) instead of mocking fetch.
// ---------------------------------------------------------------------------

/**
 * Fetches items over HTTP. Throws on a non-OK response so the query layer can
 * surface an error toast.
 */
export const fetchItems = async ({
  limit = DEFAULT_ITEMS_LIMIT,
  search
}: IGetItemsParams): Promise<IItemDto[]> => {
  const params = new URLSearchParams({ limit: String(limit) })
  if (search) params.set('search', search)

  const response = await fetch(`${ITEMS_API_URL}?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch items: ${response.status}`)
  }

  return (await response.json()) as IItemDto[]
}
