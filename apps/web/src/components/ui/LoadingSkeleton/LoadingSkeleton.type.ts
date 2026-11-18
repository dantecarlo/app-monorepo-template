import type { CSSProperties } from 'react'

import type { LoadingSkeletonRoundedType } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.constant'

export interface ILoadingSkeletonProps {
  className?: string
  height?: CSSProperties['height']
  rounded?: LoadingSkeletonRoundedType
  width?: CSSProperties['width']
}
