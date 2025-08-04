import { useContext } from "react";
import { AuthContext } from "../context/AuthContextProvider";
import type { AuthContextType } from "../types/auth";

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useSession = () => {
  const { session, loading } = useAuth();
  return { session, loading };
};