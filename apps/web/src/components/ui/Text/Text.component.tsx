import { textVariants } from '@/components/ui/Text/Text.style'
import type { ITextProps } from '@/components/ui/Text/Text.type'

export const Text = ({
  as: Element = 'span',
  children,
  className,
  tone,
  variant,
  weight
}: ITextProps) => (
  <Element
    className={textVariants({ class: className, tone, variant, weight })}
  >
    {children}
  </Element>
)
