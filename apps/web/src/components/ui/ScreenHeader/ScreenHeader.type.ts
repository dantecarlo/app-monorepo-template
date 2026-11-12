import type { IconNameType } from '@/components/ui/Icon/Icon.component'

export interface IScreenHeaderProps {
  actionLabel?: string
  actionName?: IconNameType
  backLabel: string
  onAction?: () => void
  onBack?: () => void
  title: string
}
