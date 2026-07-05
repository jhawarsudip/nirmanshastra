export default function PlumbingBackground() {
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
          {/* Pipe-schematic riser pattern — IS 1172 layout language */}
          <pattern
            id="ns-plumb"
            x="0"
            y="0"
            width="80"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            {/* Pipe (double-line representing pipe cross-section) */}
            <line x1="0" y1="29" x2="80" y2="29" stroke="#0D7877" strokeWidth="0.6" />
            <line x1="0" y1="35" x2="80" y2="35" stroke="#0D7877" strokeWidth="0.6" />
            {/* Vertical branch / riser */}
            <line x1="40" y1="0" x2="40" y2="29" stroke="#0D7877" strokeWidth="0.6" />
            {/* Junction node */}
            <circle cx="40" cy="29" r="2.5" fill="#0D7877" opacity="0.5" />
            {/* End-cap on branch top */}
            <line x1="36" y1="2" x2="44" y2="2" stroke="#0D7877" strokeWidth="0.55" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ns-plumb)" />
      </svg>
    </div>
  )
}
