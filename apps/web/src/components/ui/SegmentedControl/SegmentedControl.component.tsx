import type { JSX } from 'react'

import { SEGMENTED_CONTROL } from '@/components/ui/SegmentedControl/SegmentedControl.constant'
import type { ISegmentedControlProps } from '@/components/ui/SegmentedControl/SegmentedControl.type'

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
