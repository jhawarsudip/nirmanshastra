/*
  Server side of the campaign tags. The browser sends whatever it holds; this keeps only the three known keys,
  as short plain text, so nothing odd can reach Razorpay's order notes or our database.
*/

export interface CleanAttribution {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

const KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const

export function sanitizeAttribution(raw: unknown): CleanAttribution {
  const out: CleanAttribution = {}
  if (!raw || typeof raw !== 'object') return out
  for (const k of KEYS) {
    const v = (raw as Record<string, unknown>)[k]
    if (typeof v !== 'string') continue
    const s = v.replace(/[\u0000-\u001f<>"'`\\]/g, '').trim().slice(0, 80)
    if (s) out[k] = s
  }
  return out
}

/**
 * Save the tags on the estimate's saved inputs (jsonb), under `attribution`, without a database change.
 * Never throws: a failure here must not stop a payment.
 */
export async function saveAttributionOnEstimate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  estimateId: string,
  attribution: CleanAttribution,
): Promise<void> {
  if (!Object.keys(attribution).length) return
  try {
    const { data } = await supabase.from('estimates').select('input_data').eq('id', estimateId).maybeSingle()
    const current = (data?.input_data && typeof data.input_data === 'object' ? data.input_data : {}) as Record<string, unknown>
    // the first tags recorded for this estimate stay: a later visit must not rewrite which campaign brought the sale
    if (current.attribution) return
    await supabase.from('estimates').update({ input_data: { ...current, attribution } }).eq('id', estimateId)
  } catch (e) {
    console.error('Could not save campaign tags:', e)
  }
}
