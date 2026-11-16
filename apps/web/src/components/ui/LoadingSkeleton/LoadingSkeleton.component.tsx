import { useTranslations } from 'next-intl'
import type { JSX } from 'react'

import { loadingSkeletonVariants } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.style'
import type { ILoadingSkeletonProps } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.type'

export const LoadingSkeleton = ({
  className,
  height,
  rounded,
  width
}: ILoadingSkeletonProps): JSX.Element => {
  const t = useTranslations('common')
  const { root, shimmer } = loadingSkeletonVariants({ rounded })

  return (
    <div
      aria-busy="true"
      aria-label={t('loading')}
      className={root({ class: className })}
      role="status"
      style={{ height, width }}
    >
      <div className={shimmer()} />
    </div>
  )
}
