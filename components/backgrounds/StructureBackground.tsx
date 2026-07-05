export default function StructureBackground() {
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
          <pattern
            id="ns-struct"
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            {/* Grid lines — rebar layout */}
            <line x1="0" y1="30" x2="60" y2="30" stroke="#1F4E79" strokeWidth="0.7" />
            <line x1="30" y1="0" x2="30" y2="60" stroke="#1F4E79" strokeWidth="0.7" />
            {/* Node circle at intersection — column marker */}
            <circle cx="30" cy="30" r="3" fill="none" stroke="#1F4E79" strokeWidth="0.5" />
            {/* Corner dots */}
            <circle cx="0" cy="0" r="1.5" fill="#1F4E79" />
            <circle cx="60" cy="0" r="1.5" fill="#1F4E79" />
            <circle cx="0" cy="60" r="1.5" fill="#1F4E79" />
            <circle cx="60" cy="60" r="1.5" fill="#1F4E79" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ns-struct)" />
      </svg>
    </div>
  )
}
