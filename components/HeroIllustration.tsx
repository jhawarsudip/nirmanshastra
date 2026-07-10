export default function HeroIllustration() {
  return (
    <svg width="100%" viewBox="0 0 680 610" role="img">
      <title>House cutaway with six coloured, labelled trade badges</title>

      {/* House body — fades in first */}
      <g className="reveal" style={{ animationDelay: '0s' }}>
        <polygon points="200,240 340,140 480,240" fill="#2A2F37" stroke="#F4F4F0" strokeWidth={3} />
        <rect x={220} y={240} width={240} height={240} fill="#2A2F37" stroke="#F4F4F0" strokeWidth={2.5} />
        <line x1={200} y1={360} x2={480} y2={360} stroke="#F4F4F0" strokeWidth={4} />
        <line x1={260} y1={360} x2={260} y2={478} stroke="#F4F4F0" strokeWidth={3} />
        <line x1={340} y1={360} x2={340} y2={478} stroke="#F4F4F0" strokeWidth={3} />
        <line x1={420} y1={360} x2={420} y2={478} stroke="#F4F4F0" strokeWidth={3} />
        <circle cx={255} cy={464} r={2} fill="#C9A84C" />
        <circle cx={265} cy={464} r={2} fill="#C9A84C" />
        <circle cx={335} cy={464} r={2} fill="#C9A84C" />
        <circle cx={345} cy={464} r={2} fill="#C9A84C" />
        <circle cx={415} cy={464} r={2} fill="#C9A84C" />
        <circle cx={425} cy={464} r={2} fill="#C9A84C" />
        <rect x={318} y={420} width={44} height={60} fill="#1E2227" stroke="#F4F4F0" strokeWidth={2} />
        <circle cx={352} cy={450} r={2.5} fill="#C9A84C" />
        <rect x={245} y={390} width={35} height={35} fill="#1E2227" stroke="#F4F4F0" strokeWidth={1.5} />
        <rect x={400} y={390} width={35} height={35} fill="#1E2227" stroke="#F4F4F0" strokeWidth={1.5} />
        <rect x={245} y={270} width={35} height={35} fill="#1E2227" stroke="#F4F4F0" strokeWidth={1.5} />
        <rect x={400} y={270} width={35} height={35} fill="#1E2227" stroke="#F4F4F0" strokeWidth={1.5} />
        <line x1={160} y1={480} x2={520} y2={480} stroke="#F4F4F0" strokeWidth={1.5} />
      </g>

      {/* Leader → STRUCTURE */}
      <path className="leader" style={{ animationDelay: '0.5s' }} d="M250,478 L112,498" fill="none" stroke="#F4F4F0" strokeWidth={1} />
      <g className="reveal" style={{ animationDelay: '0.6s' }}>
        <circle cx={90} cy={500} r={28} fill="#D4AF37" stroke="#F4F4F0" strokeWidth={1.5} />
        <rect x={82} y={486} width={16} height={28} fill="none" stroke="#F4F4F0" strokeWidth={1.5} />
        <circle cx={87} cy={495} r={2} fill="#C9A84C" />
        <circle cx={93} cy={495} r={2} fill="#C9A84C" />
        <circle cx={87} cy={507} r={2} fill="#C9A84C" />
        <circle cx={93} cy={507} r={2} fill="#C9A84C" />
        <text x={90} y={542} textAnchor="middle" fontFamily="monospace" fontSize={11} fill="#F4F4F0">STRUCTURE</text>
      </g>

      {/* Leader → MASONRY */}
      <path className="leader" style={{ animationDelay: '0.7s' }} d="M220,340 L112,332" fill="none" stroke="#F4F4F0" strokeWidth={1} />
      <g className="reveal" style={{ animationDelay: '0.8s' }}>
        <circle cx={90} cy={330} r={28} fill="#8C3A22" stroke="#F4F4F0" strokeWidth={1.5} />
        <rect x={78} y={320} width={14} height={7} fill="none" stroke="#F4F4F0" strokeWidth={1.5} />
        <rect x={94} y={320} width={14} height={7} fill="none" stroke="#F4F4F0" strokeWidth={1.5} />
        <rect x={86} y={329} width={14} height={7} fill="none" stroke="#F4F4F0" strokeWidth={1.5} />
        <text x={90} y={372} textAnchor="middle" fontFamily="monospace" fontSize={11} fill="#F4F4F0">MASONRY</text>
      </g>

      {/* Leader → ELECTRICAL */}
      <path className="leader" style={{ animationDelay: '0.9s' }} d="M232,250 L112,195" fill="none" stroke="#F4F4F0" strokeWidth={1} />
      <g className="reveal" style={{ animationDelay: '1.0s' }}>
        <circle cx={90} cy={180} r={28} fill="#D99A06" stroke="#1E2227" strokeWidth={1.5} />
        <polygon points="92,165 82,185 90,185 84,200 100,178 92,178" fill="#1E2227" />
        <text x={90} y={222} textAnchor="middle" fontFamily="monospace" fontSize={11} fill="#F4F4F0">ELECTRICAL</text>
      </g>

      {/* Leader → VASTU */}
      <path className="leader" style={{ animationDelay: '1.1s' }} d="M340,150 L340,78" fill="none" stroke="#F4F4F0" strokeWidth={1} />
      <g className="reveal" style={{ animationDelay: '1.2s' }}>
        <circle cx={340} cy={55} r={28} fill="#C9A84C" stroke="#1E2227" strokeWidth={1.5} />
        <polygon points="340,40 349,58 340,52 331,58" fill="#1E2227" />
        <line x1={340} y1={68} x2={340} y2={72} stroke="#1E2227" strokeWidth={2} />
        <line x1={316} y1={55} x2={320} y2={55} stroke="#1E2227" strokeWidth={2} />
        <line x1={360} y1={55} x2={364} y2={55} stroke="#1E2227" strokeWidth={2} />
        <text x={340} y={97} textAnchor="middle" fontFamily="monospace" fontSize={11} fill="#F4F4F0">VASTU</text>
      </g>

      {/* Leader → PLUMBING */}
      <path className="leader" style={{ animationDelay: '1.3s' }} d="M448,250 L568,195" fill="none" stroke="#F4F4F0" strokeWidth={1} />
      <g className="reveal" style={{ animationDelay: '1.4s' }}>
        <circle cx={590} cy={180} r={28} fill="#2D6E6E" stroke="#F4F4F0" strokeWidth={1.5} />
        <path d="M580,166 L580,185 L600,185" fill="none" stroke="#F4F4F0" strokeWidth={2.5} />
        <circle cx={600} cy={185} r={4} fill="none" stroke="#F4F4F0" strokeWidth={1.5} />
        <text x={590} y={222} textAnchor="middle" fontFamily="monospace" fontSize={11} fill="#F4F4F0">PLUMBING</text>
      </g>

      {/* Leader → INTERIOR */}
      <path className="leader" style={{ animationDelay: '1.5s' }} d="M450,340 L568,332" fill="none" stroke="#F4F4F0" strokeWidth={1} />
      <g className="reveal" style={{ animationDelay: '1.6s' }}>
        <circle cx={590} cy={330} r={28} fill="#B08968" stroke="#1E2227" strokeWidth={1.5} />
        <rect x={578} y={318} width={24} height={24} fill="none" stroke="#1E2227" strokeWidth={1.5} />
        <line x1={590} y1={318} x2={590} y2={342} stroke="#1E2227" strokeWidth={1.5} />
        <line x1={578} y1={330} x2={602} y2={330} stroke="#1E2227" strokeWidth={1.5} />
        <text x={590} y={372} textAnchor="middle" fontFamily="monospace" fontSize={11} fill="#F4F4F0">INTERIOR</text>
      </g>
    </svg>
  )
}
