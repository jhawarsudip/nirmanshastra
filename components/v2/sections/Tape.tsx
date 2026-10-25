import { TAPE, pick, type Loc } from '@/lib/v2/copy'

/** Ticker under the hero: the questions every homeowner has. Decorative; everything it says is answered further down. */
export default function Tape({ loc }: { loc: Loc }) {
  const seg = (k: string) => (
    <div className="ns-tape__seg" key={k}>
      {TAPE.map((c, i) => <span key={i}>{pick(c, loc)}</span>)}
    </div>
  )
  return (
    <div className="ns-tape" aria-hidden="true">
      <div className="ns-tape__track">{seg('a')}{seg('b')}</div>
    </div>
  )
}
