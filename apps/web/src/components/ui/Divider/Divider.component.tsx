import { dividerVariants } from '@/components/ui/Divider/Divider.style'
import type { IDividerProps } from '@/components/ui/Divider/Divider.type'

export const Divider = ({ className, label }: IDividerProps) => {
  const { label: labelClass, root, rule } = dividerVariants()

  return (
    <div className={root({ class: className })}>
      <span aria-hidden="true" className={rule()} />
      {label !== undefined && (
        <>
          <span className={labelClass()}>{label}</span>
          <span aria-hidden="true" className={rule()} />
        </>
      )}
    </div>
  )
}
