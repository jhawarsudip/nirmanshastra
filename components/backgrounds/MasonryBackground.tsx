export default function MasonryBackground() {
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
          {/* Running-bond brick coursing — IS 2212 standard pattern */}
          <pattern
            id="ns-mason"
            x="0"
            y="0"
            width="120"
            height="46"
            patternUnits="userSpaceOnUse"
          >
            {/* Row 1: two full bricks */}
            <rect x="1" y="1" width="57" height="19" fill="none" stroke="#8C3A22" strokeWidth="0.6" />
            <rect x="62" y="1" width="57" height="19" fill="none" stroke="#8C3A22" strokeWidth="0.6" />
            {/* Row 2: offset by 30px (running bond) */}
            <rect x="-29" y="24" width="57" height="19" fill="none" stroke="#8C3A22" strokeWidth="0.6" />
            <rect x="32" y="24" width="57" height="19" fill="none" stroke="#8C3A22" strokeWidth="0.6" />
            <rect x="93" y="24" width="57" height="19" fill="none" stroke="#8C3A22" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ns-mason)" />
      </svg>
    </div>
  )
}
