import React from 'react'

export function InteriorIcon({ size = 48 }: { size?: number }) {
  const tiles: React.ReactElement[] = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      tiles.push(
        <rect
          key={`${row}-${col}`}
          x={4 + col * 14}
          y={4 + row * 14}
          width={12}
          height={12}
          stroke="#B08968"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      )
    }
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {tiles}
    </svg>
  )
}
