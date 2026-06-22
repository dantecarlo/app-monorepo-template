// Mirrors apps/web/src/lib/query/queryKeys.constant.ts — identical shape.
// TanStack Query is framework-agnostic; this file is copy-safe.

export const QueryKeys = {
  items: {
    all: ['items'] as const,
    detail: (id: string) => ['items', id] as const,
    list: (filter?: string) =>
      filter
        ? (['items', 'list', filter] as const)
        : (['items', 'list'] as const)
  }
} as const
