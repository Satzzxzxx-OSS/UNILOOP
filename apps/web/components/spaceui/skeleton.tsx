/**
 * Adapted from Space UI, src/registry/primitives/skeleton/index.tsx.
 * Copyright (c) 2026 Space UI, MIT license: docs/licenses/SPACE-UI-MIT.txt.
 * Original: https://github.com/usespaceui/ui
 * Adaptation: local className concatenation to avoid a mandatory class utility.
 */
import type React from "react";

export function Skeleton({className="",...props}:React.ComponentProps<"div">):React.ReactElement{
  return <div
    className={
      "animate-skeleton rounded-sm [--skeleton-highlight:--alpha(var(--color-white)/64%)] "+
      "[background:linear-gradient(120deg,transparent_40%,var(--skeleton-highlight),transparent_60%)_var(--color-muted)_0_0/200%_100%_fixed] "+
      "dark:[--skeleton-highlight:--alpha(var(--color-white)/4%)] "+className
    }
    data-slot="skeleton" aria-hidden="true" {...props}/>;
}
