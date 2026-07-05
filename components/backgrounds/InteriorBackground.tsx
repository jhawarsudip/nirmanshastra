export default function InteriorBackground() {
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
          {/* Floor-tile grid hatch — standard interior drawing convention */}
          <pattern
            id="ns-interior"
            x="0"
            y="0"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            {/* Tile outline */}
            <rect x="0" y="0" width="50" height="50" fill="none" stroke="#B5814E" strokeWidth="0.5" />
            {/* Inner grout cross — subtle tile-centre mark */}
            <line x1="10" y1="25" x2="40" y2="25" stroke="#B5814E" strokeWidth="0.25" opacity="0.6" />
            <line x1="25" y1="10" x2="25" y2="40" stroke="#B5814E" strokeWidth="0.25" opacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ns-interior)" />
      </svg>
    </div>
  )
}
