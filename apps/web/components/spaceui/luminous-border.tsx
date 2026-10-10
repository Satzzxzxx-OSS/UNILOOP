/* Space UI public MIT source, snapshot 7b22c0b494cec56a2f569c3a1dd4ceab604b4c53.
 * Adapted imports and bounded UNILOOP usage. License: docs/licenses/SPACE-UI-MIT.txt. */
"use client";
import * as React from 'react';
import {cn} from '@/lib/spaceui-utils';
type ColorVariant='ocean'|'sunset'|'colorful'|'mono';
const CHROMATIC_CONFIGS: Record<
  ColorVariant,
  {
    border: Array<{ color: string; pos: string; size: string }>
  }
> = {
  ocean: {
    border: [
      { color: 'rgb(100, 80, 220)', pos: '33% -7.4%', size: '4.375rem 2.5rem' },
      { color: 'rgb(60, 120, 255)', pos: '12% -5%', size: '3.75rem 2.1875rem' },
      { color: 'rgb(80, 100, 200)', pos: '2.1% 68.3%', size: '2.5rem 4.375rem' },
      { color: 'rgb(50, 140, 220)', pos: '2.1% 68.3%', size: '1.25rem 2.1875rem' },
      { color: 'rgb(120, 80, 255)', pos: '74.4% 100%', size: '11.25rem 2rem' },
      { color: 'rgb(70, 130, 255)', pos: '55% 100%', size: '5.3125rem 1.625rem' },
      { color: 'rgb(140, 100, 240)', pos: '93.9% 0%', size: '4.625rem 2rem' },
      { color: 'rgb(90, 110, 230)', pos: '100% 27.1%', size: '1.625rem 2.625rem' },
      { color: 'rgb(130, 70, 255)', pos: '100% 27.1%', size: '3.25rem 3rem' },
    ],
  },
  sunset: {
    border: [
      { color: 'rgb(255, 80, 50)', pos: '33% -7.4%', size: '4.375rem 2.5rem' },
      { color: 'rgb(255, 160, 40)', pos: '12% -5%', size: '3.75rem 2.1875rem' },
      { color: 'rgb(255, 120, 60)', pos: '2.1% 68.3%', size: '2.5rem 4.375rem' },
      { color: 'rgb(255, 200, 50)', pos: '2.1% 68.3%', size: '1.25rem 2.1875rem' },
      { color: 'rgb(255, 100, 80)', pos: '74.4% 100%', size: '11.25rem 2rem' },
      { color: 'rgb(255, 180, 60)', pos: '55% 100%', size: '85px 26px' },
      { color: 'rgb(255, 60, 60)', pos: '93.9% 0%', size: '4.625rem 2rem' },
      { color: 'rgb(255, 140, 50)', pos: '100% 27.1%', size: '1.625rem 2.625rem' },
      { color: 'rgb(255, 90, 70)', pos: '100% 27.1%', size: '3.25rem 3rem' },
    ],
  },
  colorful: {
    border: [
      { color: 'rgb(255, 50, 100)', pos: '33% -7.4%', size: '4.375rem 2.5rem' },
      { color: 'rgb(40, 140, 255)', pos: '12% -5%', size: '3.75rem 2.1875rem' },
      { color: 'rgb(50, 200, 80)', pos: '2.1% 68.3%', size: '2.5rem 4.375rem' },
      { color: 'rgb(30, 185, 170)', pos: '2.1% 68.3%', size: '1.25rem 2.1875rem' },
      { color: 'rgb(100, 70, 255)', pos: '74.4% 100%', size: '11.25rem 2rem' },
      { color: 'rgb(40, 140, 255)', pos: '55% 100%', size: '5.3125rem 1.625rem' },
      { color: 'rgb(255, 120, 40)', pos: '93.9% 0%', size: '4.625rem 2rem' },
      { color: 'rgb(240, 50, 180)', pos: '100% 27.1%', size: '1.625rem 2.625rem' },
      { color: 'rgb(180, 40, 240)', pos: '100% 27.1%', size: '3.25rem 3rem' },
    ],
  },
  mono: {
    border: [
      { color: 'rgb(180, 180, 180)', pos: '33% -7.4%', size: '4.375rem 2.5rem' },
      { color: 'rgb(140, 140, 140)', pos: '12% -5%', size: '3.75rem 2.1875rem' },
      { color: 'rgb(160, 160, 160)', pos: '2.1% 68.3%', size: '2.5rem 4.375rem' },
      { color: 'rgb(130, 130, 130)', pos: '2.1% 68.3%', size: '1.25rem 2.1875rem' },
      { color: 'rgb(170, 170, 170)', pos: '74.4% 100%', size: '11.25rem 2rem' },
      { color: 'rgb(150, 150, 150)', pos: '55% 100%', size: '5.3125rem 1.625rem' },
      { color: 'rgb(190, 190, 190)', pos: '93.9% 0%', size: '4.625rem 2rem' },
      { color: 'rgb(145, 145, 145)', pos: '100% 27.1%', size: '1.625rem 2.625rem' },
      { color: 'rgb(165, 165, 165)', pos: '100% 27.1%', size: '3.25rem 3rem' },
    ],
  },
}

function buildRadialPerimeters(variant: ColorVariant): string {
  const p = CHROMATIC_CONFIGS[variant] || CHROMATIC_CONFIGS.ocean
  return p.border
    .map((item) => `radial-gradient(ellipse ${item.size} at ${item.pos}, ${item.color}, transparent)`)
    .join(',\n    ')
}

function buildRadialAtmospheres(variant: ColorVariant): string {
  const p = CHROMATIC_CONFIGS[variant] || CHROMATIC_CONFIGS.ocean
  const alpha = variant === 'mono' ? 0.225 : 0.45
  return p.border
    .map((item) => {
      const c = item.color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
      const [w, h] = item.size.split(' ').map((s) => {
        const val = parseFloat(s)
        const unit = s.replace(/[\d.]/g, '')
        return `${(val * 0.9).toFixed(4)}${unit}`
      })
      return `radial-gradient(ellipse ${w} ${h} at ${item.pos}, ${c}, transparent)`
    })
    .join(',\n    ')
}

interface LuminousBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  borderRadius?: number
  borderWidth?: number
  brightness?: number
  saturation?: number
  hueRange?: number
  duration?: number
  colorVariant?: ColorVariant
  staticColors?: boolean
  children: React.ReactNode
}

export const LuminousBorder = React.forwardRef<HTMLDivElement, LuminousBorderProps>(
  (
    {
      children,
      borderRadius = 20,
      borderWidth = 1,
      brightness = 1.35,
      saturation = 1.25,
      hueRange = 26,
      duration = 2.4,
      colorVariant = 'ocean',
      staticColors = false,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const rawId = React.useId()
    const id = React.useMemo(() => `orbit-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId])
    const containerRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
      const el = containerRef.current
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

      let animationFrameId: number
      const startTime = performance.now()
      const durMs = duration * 1000

      const updateAngle = (now: number) => {
        const elapsed = (now - startTime) % durMs
        const angle = (elapsed / durMs) * 360
        el.style.setProperty(`--orbit-deg-${id}`, `${angle.toFixed(2)}deg`)
        animationFrameId = requestAnimationFrame(updateAngle)
      }

      animationFrameId = requestAnimationFrame(updateAngle)
      return () => cancelAnimationFrame(animationFrameId)
    }, [id, duration])

    const cssString = React.useMemo(() => {
      const innerRadiusRem = `${(Math.max(0, borderRadius - borderWidth) / 16).toFixed(4)}rem`
      const outerRadiusRem = `${(borderRadius / 16).toFixed(4)}rem`
      const edgeWidthRem = `${(borderWidth / 16).toFixed(4)}rem`
      const edgeAlpha = 0.52
      const surfaceAlpha = 0.42
      const diffusionAlpha = 0.35

      const chromaAnimation = staticColors ? '' : `animation: orbit-chroma-${id} 12s ease-in-out infinite;`

      const chromaKeyframes = staticColors
        ? ''
        : `
@keyframes orbit-chroma-${id} {
  0% { filter: hue-rotate(-${hueRange}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  50% { filter: hue-rotate(${hueRange}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  100% { filter: hue-rotate(-${hueRange}deg) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
}`

      const conicEdgeGradient = `conic-gradient(
        from var(--orbit-deg-${id}),
        transparent 0%, transparent 54%,
        rgba(255, 255, 255, 0.1) 57%,
        rgba(255, 255, 255, 0.3) 60%,
        rgba(255, 255, 255, 0.6) 63%,
        rgba(255, 255, 255, 0.75) 66%,
        rgba(255, 255, 255, 0.6) 69%,
        rgba(255, 255, 255, 0.3) 72%,
        rgba(255, 255, 255, 0.1) 75%,
        transparent 78%, transparent 100%
      )`

      const conicBloomGradient = `conic-gradient(
        from var(--orbit-deg-${id}),
        transparent 0%, transparent 58%,
        rgba(255, 255, 255, 0.03) 62%,
        rgba(255, 255, 255, 0.08) 65%,
        rgba(255, 255, 255, 0.2) 67%,
        rgba(255, 255, 255, 0.45) 69%,
        rgba(255, 255, 255, 0.85) 70%,
        rgba(255, 255, 255, 0.85) 70.5%,
        rgba(255, 255, 255, 0.45) 71.5%,
        rgba(255, 255, 255, 0.2) 73%,
        rgba(255, 255, 255, 0.08) 75%,
        rgba(255, 255, 255, 0.03) 78%,
        transparent 82%
      )`

      const perimeterLayers = buildRadialPerimeters(colorVariant)
      const surfaceLayers = buildRadialAtmospheres(colorVariant)

      return `
@property --orbit-deg-${id} {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: true;
}

@property --orbit-alpha-${id} {
  syntax: "<number>";
  initial-value: 1;
  inherits: true;
}

[data-glow-orbit="${id}"] {
  position: relative;
  border-radius: ${outerRadiusRem};
  overflow: hidden;
}

[data-glow-orbit="${id}"][data-active] {
  animation:
    orbit-rotation-${id} ${duration}s linear infinite,
    orbit-fade-${id} 0.6s ease forwards;
}

[data-glow-orbit="${id}"][data-active]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${innerRadiusRem};
  padding: ${edgeWidthRem};
  clip-path: inset(0 round ${outerRadiusRem});
  background: ${conicEdgeGradient}, ${perimeterLayers};
  -webkit-mask:
    conic-gradient(
      from var(--orbit-deg-${id}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: source-in, xor;
  mask:
    conic-gradient(
      from var(--orbit-deg-${id}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: intersect, exclude;
  pointer-events: none;
  z-index: 2;
  opacity: calc(var(--orbit-alpha-${id}, 1) * ${edgeAlpha} * var(--orbit-scale, 1));
  ${chromaAnimation}
}

[data-glow-orbit="${id}"][data-active]::before {
  content: "";
  position: absolute;
  inset: 0;
  corner-shape: squircle;
  border-radius: ${outerRadiusRem};
  background: ${surfaceLayers};
  -webkit-mask-image:
    conic-gradient(
      from var(--orbit-deg-${id}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(white, transparent 1.75rem, transparent calc(100% - 1.75rem), white),
    linear-gradient(to right, white, transparent 1.75rem, transparent calc(100% - 1.75rem), white);
  -webkit-mask-composite: source-in, source-over;
  mask-image:
    conic-gradient(
      from var(--orbit-deg-${id}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(white, transparent 1.75rem, transparent calc(100% - 1.75rem), white),
    linear-gradient(to right, white, transparent 1.75rem, transparent calc(100% - 1.75rem), white);
  mask-composite: intersect, add;
  pointer-events: none;
  z-index: 1;
  opacity: calc(var(--orbit-alpha-${id}, 1) * ${surfaceAlpha} * var(--orbit-scale, 1));
  clip-path: inset(0 round ${outerRadiusRem});
  ${chromaAnimation}
}

[data-glow-orbit="${id}"] [data-glow-diffusion] {
  display: block;
  position: absolute;
  inset: 0;
  corner-shape: squircle;
  border-radius: ${innerRadiusRem};
  clip-path: inset(0 round ${outerRadiusRem});
  background: ${conicBloomGradient};
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  padding: ${edgeWidthRem};
  filter: blur(0.5rem) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)});
  pointer-events: none;
  z-index: 3;
  opacity: calc(var(--orbit-alpha-${id}, 1) * ${diffusionAlpha} * var(--orbit-scale, 1));
}

@keyframes orbit-rotation-${id} {
  to { --orbit-deg-${id}: 360deg; }
}

@keyframes orbit-fade-${id} {
  to { --orbit-alpha-${id}: 1; }
}
${chromaKeyframes}
@media(prefers-reduced-motion:reduce){[data-glow-orbit="${id}"][data-active],[data-glow-orbit="${id}"]::before,[data-glow-orbit="${id}"]::after{animation:none!important}}
`
    }, [id, borderRadius, borderWidth, duration, brightness, saturation, hueRange, staticColors, colorVariant])

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: cssString }} />
        <div
          ref={(node) => {
            containerRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
          }}
          data-glow-orbit={id}
          data-active=""
          className={cn('relative', className)}
          style={{
            borderRadius: `${(borderRadius / 16).toFixed(4)}rem`,
            ...style,
          }}
          {...props}
        >
          {children}
          <div data-glow-diffusion="" aria-hidden="true" />
        </div>
      </>
    )
  },
)
LuminousBorder.displayName = 'LuminousBorder'
