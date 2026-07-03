export function StructureIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Column cross-section outline */}
      <rect x="8" y="8" width="32" height="32" stroke="#1F4E79" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {/* Corner rebar dots */}
      <circle cx="13" cy="13" r="3" fill="#1F4E79" />
      <circle cx="35" cy="13" r="3" fill="#1F4E79" />
      <circle cx="13" cy="35" r="3" fill="#1F4E79" />
      <circle cx="35" cy="35" r="3" fill="#1F4E79" />
      {/* Column grid label */}
      <text x="20" y="29" fontSize="8" fill="#1F4E79" fontFamily="monospace" opacity="0.7">C1</text>
    </svg>
  )
}
