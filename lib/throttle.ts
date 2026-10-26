/*
  A small "no more than N in a window" check, kept in the memory of the running server instance.
  It slows down a script that hammers one address or one visitor; it is not a firewall. Each warm instance counts on its
  own, so the real limit is a little looser than the number given. Real rate limiting (Vercel Firewall or a shared store)
  is still an open item.
*/

const hits = new Map<string, number[]>()
let sweepAt = 0

/** true if this call is allowed (and counted); false if `key` already had `max` calls inside `windowMs`. */
export function allow(key: string, max: number, windowMs: number, now: number = Date.now()): boolean {
  if (now - sweepAt > windowMs) {
    sweepAt = now
    for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(k)
  }
  const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}

/** the caller's address as Vercel passes it on, for use as a throttle key */
export function clientKey(req: { headers: { get(name: string): string | null } }): string {
  const xff = req.headers.get('x-forwarded-for')
  return (xff ? xff.split(',')[0] : req.headers.get('x-real-ip') ?? 'unknown').trim().slice(0, 64)
}
