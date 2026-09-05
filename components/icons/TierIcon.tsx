export function TierIcon({ size = 48 }: { size?: number; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Baseline */}
      <line x1="7" y1="40" x2="41" y2="40" stroke="#1F4E79" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {/* Four rising tier columns — Basic → Standard → Premium → Luxury */}
      <rect x="8"  y="30" width="7" height="10" stroke="#1F4E79" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.55" />
      <rect x="16" y="24" width="7" height="16" stroke="#1F4E79" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.7" />
      <rect x="24" y="17" width="7" height="23" stroke="#1F4E79" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.85" />
      <rect x="32" y="9"  width="7" height="31" stroke="#1F4E79" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {/* Rupee mark on the tallest tier */}
      <text x="35.5" y="24" fontSize="9" fill="#1F4E79" fontFamily="monospace" textAnchor="middle">₹</text>
    </svg>
  )
}
