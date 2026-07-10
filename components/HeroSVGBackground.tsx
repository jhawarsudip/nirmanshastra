'use client'

import { useEffect, useRef } from 'react'

// Abstract isometric structural column grid
// stroke="#C5A059", stroke-width="0.5", fill="none", opacity=0.15
// Scroll-driven draw-in: draws on scroll down, un-draws on scroll up
// prefers-reduced-motion: shows fully drawn / static
export default function HeroSVGBackground() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path'))
    const lengths = paths.map(p => p.getTotalLength())

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      paths.forEach((p, i) => {
        p.style.strokeDasharray = String(lengths[i])
        p.style.strokeDashoffset = '0'
      })
      return
    }

    // Start fully undrawn
    paths.forEach((p, i) => {
      p.style.strokeDasharray = String(lengths[i])
      p.style.strokeDashoffset = String(lengths[i])
    })

    const hero = document.getElementById('hero-root')
    let raf = 0

    const update = () => {
      const heroH = hero?.offsetHeight ?? window.innerHeight
      const progress = Math.min(1, Math.max(0, window.scrollY / (heroH * 0.6)))

      paths.forEach((p, i) => {
        // Stagger: earlier paths draw first over first 20% of progress range
        const stagger = (i / paths.length) * 0.2
        const t = Math.min(1, Math.max(0, (progress - stagger) / 0.8))
        p.style.strokeDashoffset = String(lengths[i] * (1 - t))
      })
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Isometric grid constants
  // Viewport: 1440 × 900 coordinate space
  // tan(30°) = 0.5774 → across 1440px = 832px vertical displacement
  const DX = 1440
  const DY = 832 // 1440 * tan(30°) ≈ 832

  // Right-going 30° lines: from (0, y0) to (1440, y0+832)
  const rgStarts = [-800, -600, -400, -200, 0, 200, 400, 600, 800]

  // Left-going 30° lines: from (0, y0) to (1440, y0-832)
  const lgStarts = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800]

  // Vertical column lines
  const vx = [192, 384, 576, 768, 960, 1152, 1344]

  // Horizontal beam / slab lines
  const hy = [180, 360, 540, 720]

  // Column section squares at vx × hy intersections (8×8 hollow squares)
  const squares = vx.flatMap(x => hy.map(y => ({ x, y })))

  // Dimension extension ticks at selected column-beam intersections
  const ticks = [
    { x: 576, y: 360 }, { x: 576, y: 540 },
    { x: 864, y: 360 }, { x: 864, y: 540 },
  ]

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${DX} 900`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.15,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <g stroke="#C5A059" strokeWidth="0.5" fill="none">
        {/* Right-going 30° lines */}
        {rgStarts.map((y0, i) => (
          <path key={`rg${i}`} d={`M0,${y0} L${DX},${y0 + DY}`} />
        ))}

        {/* Left-going 30° lines */}
        {lgStarts.map((y0, i) => (
          <path key={`lg${i}`} d={`M0,${y0} L${DX},${y0 - DY}`} />
        ))}

        {/* Vertical column lines */}
        {vx.map((x, i) => (
          <path key={`vx${i}`} d={`M${x},0 L${x},900`} />
        ))}

        {/* Horizontal beam lines */}
        {hy.map((y, i) => (
          <path key={`hy${i}`} d={`M0,${y} L${DX},${y}`} />
        ))}

        {/* Column section squares at each intersection */}
        {squares.map(({ x, y }, i) => (
          <path
            key={`sq${i}`}
            d={`M${x - 6},${y - 6} L${x + 6},${y - 6} L${x + 6},${y + 6} L${x - 6},${y + 6} Z`}
          />
        ))}

        {/* Dimension extension ticks */}
        {ticks.map(({ x, y }, i) => (
          <path
            key={`tk${i}`}
            d={`M${x - 18},${y} L${x - 8},${y} M${x + 8},${y} L${x + 18},${y} M${x},${y - 18} L${x},${y - 8} M${x},${y + 8} L${x},${y + 18}`}
          />
        ))}
      </g>
    </svg>
  )
}
