import type { IItemDto } from '@/screens/ItemsDashboard/models/Item.type'

// Deterministic item DTOs for MSW responses and fixtures. Keep timestamps
// fixed so relative-time assertions stay stable across runs.
export const MOCK_ITEM_DTOS: IItemDto[] = [
  {
    author_id: 'usr_1',
    author_name: 'Alice Brown',
    category: 'UX',
    created_at: '2026-06-22T10:00:00.000Z',
    description: 'Streamline the first-run experience.',
    id: 'item_001',
    status: 'active',
    title: 'Improve onboarding flow',
    updated_at: '2026-06-22T10:30:00.000Z'
  },
  {
    author_id: null,
    author_name: null,
    category: 'Architecture',
    created_at: '2026-06-20T10:00:00.000Z',
    description: 'Move to the App Router with RSC.',
    id: 'item_002',
    status: 'archived',
    title: 'Migrate to App Router',
    updated_at: '2026-06-21T10:00:00.000Z'
  }
]
