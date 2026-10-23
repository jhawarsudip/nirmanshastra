import { TAPE_CODES } from '@/lib/v2/content'

/** Surveyor's-tape ticker: every IS code is a reading on the tape. Decorative; the codes are listed in full in the IS-codes section. */
export default function Tape() {
  const seg = (k: string) => (
    <div className="ns-tape__seg" key={k}>
      {TAPE_CODES.map(c => <span key={c} className="ns-mono">{c}</span>)}
    </div>
  )
  return (
    <div className="ns-tape" aria-hidden="true">
      <div className="ns-tape__track">{seg('a')}{seg('b')}</div>
    </div>
  )
}
