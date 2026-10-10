/* Space UI (MIT, 2026). Public registry: https://www.spaceui.one/r/primitives-separator.json
 * Imports adapted for UNILOOP. License: docs/licenses/SPACE-UI-MIT.txt. */
import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import type React from 'react'
import { cn } from '@/lib/spaceui-utils'

export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: Omit<SeparatorPrimitive.Props, 'className'> & { className?: string }): React.ReactElement {
  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch",
        className,
      )}
      data-slot="separator"
      orientation={orientation}
      {...props}
    />
  )
}

export { SeparatorPrimitive }
