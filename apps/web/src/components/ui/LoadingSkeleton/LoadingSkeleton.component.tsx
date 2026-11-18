import type { JSX } from 'react'

import { loadingSkeletonVariants } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.style'
import type { ILoadingSkeletonProps } from '@/components/ui/LoadingSkeleton/LoadingSkeleton.type'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

export const LoadingSkeleton = ({
  className,
  height,
  rounded,
  width
}: ILoadingSkeletonProps): JSX.Element => {
  const { t } = useAppTranslator()
  const { root, shimmer } = loadingSkeletonVariants({ rounded })

  return (
    <div
      aria-busy="true"
      aria-label={t('common.loading')}
      className={root({ class: className })}
      role="status"
      style={{ height, width }}
    >
      <div className={shimmer()} />
    </div>
  )
}
