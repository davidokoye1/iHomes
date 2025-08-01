// src/hooks/useSession.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
        }

        if (mounted) {
          // Only consider session valid if email is confirmed
          const validSession = data.session?.user?.email_confirmed_at ? data.session : null;
          setSession(validSession);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error getting session:", error);
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          // Only consider session valid if email is confirmed
          const validSession = session?.user?.email_confirmed_at ? session : null;
          setSession(validSession);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // For backward compatibility with your existing ProtectedRoute
  // Return session directly (undefined while loading, null when not authenticated, Session when authenticated)
  if (loading) {
    return undefined;
  }
  
  return session;
}