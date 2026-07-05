export default function ElectricalBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.07 }}
      >
        <defs>
          {/* Single-line diagram circuit motif — IS 732:2019 symbol language */}
          <pattern
            id="ns-elec"
            x="0"
            y="0"
            width="80"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            {/* Horizontal bus line */}
            <line x1="0" y1="24" x2="80" y2="24" stroke="#D99A06" strokeWidth="0.6" />
            {/* MCB / breaker circle at midpoint */}
            <circle cx="40" cy="24" r="6" fill="none" stroke="#D99A06" strokeWidth="0.55" />
            {/* Diagonal slash through breaker (standard symbol) */}
            <line x1="35" y1="19" x2="45" y2="29" stroke="#D99A06" strokeWidth="0.5" />
            {/* Vertical tap line going upward */}
            <line x1="40" y1="0" x2="40" y2="18" stroke="#D99A06" strokeWidth="0.45" />
            {/* Terminal bar at top of tap */}
            <line x1="36" y1="2" x2="44" y2="2" stroke="#D99A06" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ns-elec)" />
      </svg>
    </div>
  )
}
