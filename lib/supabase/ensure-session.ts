import { createClient } from '@/lib/supabase/client'

/**
 * Returns the current Supabase user id, silently creating an anonymous session
 * if the visitor does not have one yet.
 *
 * Tool flows call this at the first point a durable identity is required — the
 * registration step — rather than gating the page itself. Every estimate must
 * carry a real `user_id`: Grand Total links a person's paid phase estimates via
 * `user_id` + estimate IDs (see app/api/grand-total/create-estimate/route.ts),
 * so an estimate saved with a null user_id would be silently unlinkable.
 *
 * Returns `userId: null` with a message if no session could be established, so
 * callers can surface the failure instead of writing an orphaned estimate.
 *
 * NOTE: anonymous sign-ins must be enabled in the Supabase dashboard
 * (Authentication → Sign In / Providers → Anonymous sign-ins).
 */
export async function ensureSession(): Promise<{ userId: string | null; error: string | null }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (user) return { userId: user.id, error: null }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user) {
    return {
      userId: null,
      error: 'Could not start a session. Please try again, or log in to continue.',
    }
  }

  return { userId: data.user.id, error: null }
}
