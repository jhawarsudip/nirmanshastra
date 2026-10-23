import Image from 'next/image'

/**
 * Plumb-line load (once per session, under 900 ms, pure CSS — no JS needed to dismiss).
 * A plumb bob drops on its string and swings to rest, a spirit-level bubble centres, then the sheet lifts.
 * Skipped when <html data-plumb="skip"> (set by the inline init script) or under Calm / reduced motion.
 */
export default function PlumbLoad() {
  return (
    <div className="ns-plumb" aria-hidden="true">
      <div className="ns-plumb__rope">
        <Image src="/v2/cutouts/o02-plumb-bob.webp" alt="" width={234} height={820} priority sizes="120px" />
      </div>
      <div className="ns-plumb__level"><span className="ns-plumb__bubble" /></div>
      <div className="ns-plumb__word">NirmanShastra</div>
    </div>
  )
}
