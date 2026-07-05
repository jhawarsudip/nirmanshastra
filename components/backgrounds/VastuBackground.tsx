const SPOKES_16 = Array.from({ length: 16 }, (_, i) => {
  const rad = (i * 22.5 - 90) * (Math.PI / 180)
  return { cos: Math.cos(rad), sin: Math.sin(rad) }
})

export default function VastuBackground() {
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
          {/* 16-spoke Vastu Purusha Mandala tile — matches canvas rgba(201,168,76,…) palette */}
          <pattern
            id="ns-vastu"
            x="0"
            y="0"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            {/* Outer mandala ring */}
            <circle cx="60" cy="60" r="55" fill="none" stroke="#C9A84C" strokeWidth="0.55" />
            {/* Mid ring */}
            <circle cx="60" cy="60" r="35" fill="none" stroke="#C9A84C" strokeWidth="0.4" />
            {/* Inner ring — Brahmasthan boundary */}
            <circle cx="60" cy="60" r="14" fill="none" stroke="#C9A84C" strokeWidth="0.4" />
            {/* 16 directional spokes */}
            {SPOKES_16.map((s, i) => (
              <line
                key={i}
                x1={60 + s.cos * 14}
                y1={60 + s.sin * 14}
                x2={60 + s.cos * 55}
                y2={60 + s.sin * 55}
                stroke="#C9A84C"
                strokeWidth="0.4"
              />
            ))}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ns-vastu)" />
      </svg>
    </div>
  )
}
