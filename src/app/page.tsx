import { createClient } from '@/lib/supabase/server'
import { LandingContent } from '@/components/layout/LandingContent'
import type { User } from '@supabase/supabase-js'

export default async function Home() {
  let user: User | null = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Landing page auth lookup failed gracefully, rendering public view:', error)
    }
    user = null
  }

  return <LandingContent user={user} />
}
