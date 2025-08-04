import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "../types/database";
import { toast } from "sonner";
import type { AuthContextType, SignUpData } from "../types/auth";

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => ({ error: 'Not implemented' }),
  signUp: async () => ({ error: 'Not implemented' }),
  signOut: async () => {},
  updateProfile: async () => ({ error: 'Not implemented' }),
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user profile from database
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return profile;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  };

  // Create or update profile
  const upsertProfile = async (authUser: User, additionalData?: SignUpData): Promise<Profile | null> => {
    try {
      const profileData = {
        id: authUser.id,
        email: authUser.email!,
        full_name: additionalData?.full_name || authUser.user_metadata?.full_name || '',
        role: additionalData?.role || authUser.user_metadata?.role || 'user',
        agency_name: additionalData?.agency_name || authUser.user_metadata?.agency_name || null,
        email_confirmed: authUser.email_confirmed_at ? true : false,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: profile, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting profile:', error);
        return null;
      }

      return profile;
    } catch (err) {
      console.error('Error in upsertProfile:', err);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(initialSession);
          
          if (initialSession?.user) {
            // Fetch or create profile
            let profile = await fetchProfile(initialSession.user.id);
            
            if (!profile) {
              // Create profile if it doesn't exist
              profile = await upsertProfile(initialSession.user);
            }
            
            setUser(profile);
          }
          
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email);
        
        if (mounted) {
          setSession(newSession);
          
          if (event === 'SIGNED_IN' && newSession?.user) {
            // Handle sign in
            let profile = await fetchProfile(newSession.user.id);
            
            if (!profile) {
              profile = await upsertProfile(newSession.user);
            } else {
              // Update last login
              await supabase
                .from('profiles')
                .update({ 
                  last_login_at: new Date().toISOString(),
                  email_confirmed: newSession.user.email_confirmed_at ? true : false
                })
                .eq('id', newSession.user.id);
            }
            
            setUser(profile);
            
            // Navigate based on email confirmation
            const allowedRoutes = ["/login", "/signup", "/auth/callback", "/auth/reset-password"];
            if (newSession.user.email_confirmed_at && !allowedRoutes.includes(location.pathname)) {
              navigate("/dashboard", { replace: true });
            } else if (!newSession.user.email_confirmed_at) {
              toast.warning("Please confirm your email address to continue");
            }
            
          } else if (event === 'SIGNED_OUT') {
            // Handle sign out
            setUser(null);
            navigate("/login", { replace: true });
            
          } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
            // Handle token refresh
            const profile = await fetchProfile(newSession.user.id);
            setUser(profile);
          }
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error: error.message };
      }

      if (!data.user?.email_confirmed_at) {
        return { error: 'Please confirm your email address before logging in' };
      }

      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      return { error: message };
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: userData,
          emailRedirectTo: redirectUrl
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'User creation failed' };
      }

      // Profile will be created via database trigger
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      return { error: message };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.error('Error signing out');
      }
    } catch (err) {
      console.error('Sign out error:', err);
      toast.error('Error signing out');
    }
  };

  // Update profile function
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) {
        return { error: 'No user logged in' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return { error: error.message };
      }

      setUser(data);
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      return { error: message };
    }
  };

  // Refresh profile function
  const refreshProfile = async () => {
    try {
      if (!session?.user) return;

      const profile = await fetchProfile(session.user.id);
      if (profile) {
        setUser(profile);
      }
    } catch (err) {
      console.error('Profile refresh error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}