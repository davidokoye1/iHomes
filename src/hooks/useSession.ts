// src/hooks/useSession.ts - TEMPORARY VERSION (No Email Confirmation Check)
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
          // Accept any valid session (no email confirmation check for testing)
          setSession(data.session);
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
          // Accept any valid session (no email confirmation check for testing)
          setSession(session);
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