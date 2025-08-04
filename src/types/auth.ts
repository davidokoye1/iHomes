import type { Session } from "@supabase/supabase-js";
import type { Profile } from "./database";

export interface SignUpData {
  full_name?: string;
  role?: string;
  agency_name?: string | null;
}

export interface AuthContextType {
  session: Session | null;
  user: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}