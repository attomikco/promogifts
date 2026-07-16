import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns the authenticated Supabase user, or null if the request is not
 * signed in. Used to guard admin Route Handlers (defense-in-depth: the
 * `proxy.ts` gate already blocks `/api/admin/**`, but handlers verify too).
 */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
