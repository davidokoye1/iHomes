// hooks/useSession.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Session } from '@supabase/supabase-js'

export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return session
}
