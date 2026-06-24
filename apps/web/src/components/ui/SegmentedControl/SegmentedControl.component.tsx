import type { JSX } from 'react'

import { SEGMENTED_CONTROL } from '@/components/ui/SegmentedControl/SegmentedControl.constant'

export interface ISegment {
  id: string
  label: string
}

export interface ISegmentedControlProps {
  activeId: string
  onSegmentPress: (id: string) => void
  segments: ReadonlyArray<ISegment>
}

export const SegmentedControl = ({
  activeId,
  onSegmentPress,
  segments
}: ISegmentedControlProps): JSX.Element => (
  <div className={SEGMENTED_CONTROL.TRACK} role="tablist">
    {segments.map(({ id, label }) => {
      const isActive = id === activeId
      return (
        <button
          aria-selected={isActive}
          className={[
            SEGMENTED_CONTROL.SEGMENT_BASE,
            isActive
              ? SEGMENTED_CONTROL.SEGMENT_ACTIVE
              : SEGMENTED_CONTROL.SEGMENT_INACTIVE
          ].join(' ')}
          key={id}
          onClick={() => onSegmentPress(id)}
          role="tab"
          type="button"
        >
          {label}
        </button>
      )
    })}
  </div>
)
