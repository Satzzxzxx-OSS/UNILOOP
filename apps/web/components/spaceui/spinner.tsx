/* Source: Space UI, https://github.com/usespaceui/ui (MIT, 2026).\n * Only imports adapted for this repository. License: docs/licenses/SPACE-UI-MIT.txt. */
import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/spaceui-utils'

export function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2>): React.ReactElement {
  return (
    <Loader2
      aria-label="Loading"
      className={cn('animate-spin', className)}
      role="status"
      data-slot="spinner"
      {...props}
    />
  )
}
