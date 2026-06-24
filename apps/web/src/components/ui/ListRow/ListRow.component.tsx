import type { JSX, ReactNode } from 'react'

import {
  listRowInteractiveVariants,
  listRowVariants
} from '@/components/ui/ListRow/ListRow.styles'

export interface IListRowProps {
  leading?: ReactNode
  onClick?: () => void
  subtitle?: string
  title: string
  trailing?: ReactNode
}

/** Generic list item with optional leading/trailing slots and divider. */
export const ListRow = ({
  leading,
  onClick,
  subtitle,
  title,
  trailing
}: IListRowProps): JSX.Element => {
  const inner = (
    <>
      {leading !== undefined && <div className="flex-none">{leading}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-body font-body text-text-primary truncate">
          {title}
        </p>
        {subtitle !== undefined && (
          <p className="text-caption font-body text-text-secondary truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {trailing !== undefined && (
        <div className="flex-none">{trailing}</div>
      )}
    </>
  )

  if (onClick !== undefined) {
    return (
      <button
        className={listRowVariants({
          class: listRowInteractiveVariants()
        })}
        onClick={onClick}
        type="button"
      >
        {inner}
      </button>
    )
  }

  return <div className={listRowVariants()}>{inner}</div>
}
