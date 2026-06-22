import { ItemsDashboard } from '@/features/items/screens/ItemsDashboard.screen';

/**
 * Root page — renders the items dashboard.
 * This Server Component shell delegates rendering to the 'use client' island.
 */
export default function HomePage() {
  return <ItemsDashboard />;
}
