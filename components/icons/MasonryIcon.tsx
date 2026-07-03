export function MasonryIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Row 1 — two full bricks */}
      <rect x="3" y="8" width="20" height="9" stroke="#8C3A22" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <rect x="25" y="8" width="20" height="9" stroke="#8C3A22" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {/* Row 2 — offset by half brick (running bond) */}
      <rect x="3" y="19" width="9" height="9" stroke="#8C3A22" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <rect x="14" y="19" width="20" height="9" stroke="#8C3A22" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <rect x="36" y="19" width="9" height="9" stroke="#8C3A22" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {/* Row 3 — same as row 1 */}
      <rect x="3" y="30" width="20" height="9" stroke="#8C3A22" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <rect x="25" y="30" width="20" height="9" stroke="#8C3A22" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
