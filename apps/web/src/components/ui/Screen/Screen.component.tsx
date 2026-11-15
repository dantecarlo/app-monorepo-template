import { screenVariants } from '@/components/ui/Screen/Screen.style'
import type { IScreenProps } from '@/components/ui/Screen/Screen.type'

export const Screen = ({ children, className }: IScreenProps) => (
  <div className={screenVariants({ class: className })}>{children}</div>
)
