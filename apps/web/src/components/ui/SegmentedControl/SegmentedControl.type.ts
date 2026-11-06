export interface ISegment {
  id: string
  label: string
}

export interface ISegmentedControlProps {
  activeId: string
  onSegmentPress: (id: string) => void
  segments: ReadonlyArray<ISegment>
}
