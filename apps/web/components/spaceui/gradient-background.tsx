/* Space UI public MIT source, snapshot 7b22c0b494cec56a2f569c3a1dd4ceab604b4c53.
 * Adapted imports and bounded UNILOOP usage. License: docs/licenses/SPACE-UI-MIT.txt. */
'use client'

import * as React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'

import { cn } from '@/lib/spaceui-utils'

type GradientBackgroundProps = HTMLMotionProps<'div'>

function GradientBackground({
  className,
  transition = { duration: 15, ease: 'easeInOut', repeat: Infinity },
  ...props
}: GradientBackgroundProps) {
  const reduced=useReducedMotion();
  return (
    <motion.div
      data-slot="gradient-background"
      className={cn(
        'size-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 bg-[length:400%_400%]',
        className,
      )}
      animate={reduced?undefined:{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={transition}
      {...props}
    />
  )
}

export { GradientBackground, type GradientBackgroundProps }
