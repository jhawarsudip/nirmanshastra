import { STEPS, pick, type Loc } from '@/lib/v3/copy'

export default function Steps({ loc }: { loc: Loc }) {
  return (
    <section id="how" className="s3-section s3-steps" aria-labelledby="s3-steps-h">
      <div className="s3-wrap">
        <div className="s3-head s3-rise">
          <h2 className="s3-h2" id="s3-steps-h">{pick(STEPS.title, loc)}</h2>
        </div>

        <div className="s3-steps__grid">
          <ol className="s3-steps__list">
            {STEPS.items.map((s, i) => (
              <li key={i} className="s3-howstep s3-rise" style={{ ['--d' as string]: `${i * 0.12}s` }}>
                <span className="s3-howstep__n" aria-hidden="true">{i + 1}</span>
                <div>
                  <h3 className="s3-h3">{pick(s.title, loc)}</h3>
                  <p>{pick(s.body, loc)}</p>
                </div>
              </li>
            ))}
          </ol>

          <figure className="s3-sheet s3-rise" style={{ ['--d' as string]: '.2s' }}>
            <div className="s3-sheet__holes" aria-hidden="true"><i /><i /><i /></div>
            <figcaption>
              <span className="s3-sheet__title">{pick(STEPS.sampleTitle, loc)}</span>
              <span className="s3-sheet__sub">{pick(STEPS.sampleSub, loc)}</span>
            </figcaption>
            <table className="s3-sheet__table">
              <tbody>
                {STEPS.sampleRows.map((r, i) => (
                  <tr key={i}>
                    <th scope="row">{pick(r.label, loc)}</th>
                    <td className="s3-num">{pick(r.val, loc)}</td>
                    <td className="s3-sheet__why">{pick(r.why, loc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="s3-sheet__foot">{pick(STEPS.sampleFoot, loc)}</p>
          </figure>
        </div>
      </div>
    </section>
  )
}
