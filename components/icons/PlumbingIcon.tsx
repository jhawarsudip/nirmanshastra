export function PlumbingIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Vertical pipe */}
      <line x1="16" y1="6" x2="16" y2="30" stroke="#2D6E6E" strokeWidth="2.5" strokeLinecap="square" vectorEffect="non-scaling-stroke" />
      {/* 90° elbow */}
      <path d="M16,30 Q16,42 28,42" stroke="#2D6E6E" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
      {/* Horizontal pipe */}
      <line x1="28" y1="42" x2="44" y2="42" stroke="#2D6E6E" strokeWidth="2.5" strokeLinecap="square" vectorEffect="non-scaling-stroke" />
      {/* Open end caps */}
      <line x1="10" y1="6" x2="22" y2="6" stroke="#2D6E6E" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <line x1="44" y1="37" x2="44" y2="47" stroke="#2D6E6E" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
