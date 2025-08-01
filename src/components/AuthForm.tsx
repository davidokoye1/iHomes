// src/components/AuthForm.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import InputField from "./InputField";
import RoleSelect from "./RoleSelect";
import RememberMeCheckbox from "./RememberMeCheckbox";
import EmailConfirmationNotice from "../pages/EmailConfirmationNotice";
import "../styles/auth.css";

interface AuthFormProps {
  mode: "login" | "signup";
}

type UserRole = 'user' | 'agent';

export default function AuthForm({ mode }: AuthFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" as UserRole,
  });

  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showEmailNotice, setShowEmailNotice] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (selected: { value: string } | null) => {
    setFormData((prev) => ({ 
      ...prev, 
      role: (selected?.value || "user") as UserRole 
    }));
  };

  const validateForm = () => {
    if (mode === "signup") {
      if (!formData.fullName.trim()) {
        toast.error("Full name is required");
        return false;
      }
      if (!formData.email.trim()) {
        toast.error("Email is required");
        return false;
      }
      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return false;
      }
      if (!formData.role) {
        toast.error("Please select a role");
        return false;
      }
    } else {
      if (!formData.email.trim()) {
        toast.error("Email is required");
        return false;
      }
      if (!formData.password.trim()) {
        toast.error("Password is required");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        console.log("Starting signup process...");
        
        // Sign up the user with metadata that the database trigger expects
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName.trim(),
              role: formData.role,
              organization_name: formData.organizationName.trim() || null,
            },
            // Ensure email confirmation is required
            emailRedirectTo: `${window.location.origin}/auth/callback`
          },
        });

        console.log("Signup response:", { data, error: signUpError });

        if (signUpError) {
          console.error("Signup error details:", signUpError);
          throw signUpError;
        }
        
        if (!data.user?.id) {
          throw new Error("User ID not returned after signup");
        }

        console.log("User created successfully");
        toast.success("Account created! Please check your email to confirm your account.");
        
        // Show email confirmation notice
        setPendingEmail(formData.email.trim());
        setShowEmailNotice(true);
        
        // Reset form after successful signup
        setFormData({
          fullName: "",
          organizationName: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "user" as UserRole,
        });
        
      } else {
        // Login
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (loginError) throw loginError;

        // Check if email is confirmed
        if (data.user && !data.user.email_confirmed_at) {
          toast.error("Please confirm your email before logging in. Check your inbox for a confirmation link.");
          return;
        }

        // Handle remember me
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }

        toast.success("Successfully logged in!");
        // Navigation will be handled by the auth state change listener
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let errorMessage = "Something went wrong";
      
      // Handle specific error messages
      if (err?.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password";
      } else if (err?.message?.includes("Email not confirmed")) {
        errorMessage = "Please confirm your email before logging in";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check initial session and set up auth state listener
  useEffect(() => {
    let mounted = true;

    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            if (session.user.email_confirmed_at) {
              // User is authenticated and email is confirmed
              navigate("/dashboard", { replace: true });
              return;
            } else {
              // User exists but email not confirmed - stay on current page
              console.log("User session found but email not confirmed");
            }
          }
          setSessionChecked(true);
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted) {
          setSessionChecked(true);
        }
      }
    };

    checkInitialSession();

    // Set up auth state change listener - but only after initial check
    let authSubscription: any = null;
    
    const setupAuthListener = () => {
      authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted && sessionChecked) {
          if (session?.user?.email_confirmed_at) {
            navigate("/dashboard", { replace: true });
          }
        }
      });
    };

    // Delay setting up the listener to avoid conflicts
    const timeoutId = setTimeout(setupAuthListener, 1000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (authSubscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [navigate, sessionChecked]);

  // Load remember me preference
  useEffect(() => {
    const savedRememberMe = localStorage.getItem("rememberMe");
    if (savedRememberMe === "true") {
      setRememberMe(true);
    }
  }, []);

  // Show loading while checking session
  if (!sessionChecked) {
    return (
      <div className="auth-container">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <Toaster richColors position="top-right" />
      
      {showEmailNotice && (
        <EmailConfirmationNotice 
          email={pendingEmail}
          onClose={() => setShowEmailNotice(false)}
        />
      )}

      <h2 className="auth-title">
        {mode === "login" ? (
          <>
            Log In To Your <br />
            <span className="text-brand-primary">iHomes</span> Account
          </>
        ) : (
          <>
            Create Your <br />
            <span className="text-brand-primary">iHomes</span> Account
          </>
        )}
      </h2>

      <div className="auth-form-wrapper">
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <>
              <InputField
                type="text"
                name="fullName"
                placeholder="Full Name *"
                value={formData.fullName}
                onChange={handleInputChange}
              />
              <InputField
                type="text"
                name="organizationName"
                placeholder="Organization Name (Optional)"
                value={formData.organizationName}
                onChange={handleInputChange}
              />
            </>
          )}

          <InputField
            type="email"
            name="email"
            placeholder="Email *"
            value={formData.email}
            onChange={handleInputChange}
          />
          
          <InputField
            type="password"
            name="password"
            placeholder={mode === "signup" ? "Password (min 6 characters) *" : "Password *"}
            value={formData.password}
            onChange={handleInputChange}
          />

          {mode === "signup" && (
            <>
              <InputField
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              <RoleSelect
                value={formData.role}
                onChange={handleRoleChange}
              />
            </>
          )}

          {mode === "login" && (
            <div className="flex items-center justify-between w-full">
              <RememberMeCheckbox 
                checked={rememberMe} 
                onChange={setRememberMe} 
              />
              <Link
                to="/forgot-password"
                className="text-brand-secondary text-[16px] whitespace-nowrap hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading 
              ? (mode === "login" ? "Logging in..." : "Creating account...") 
              : (mode === "login" ? "Login" : "Sign Up")
            }
          </button>
        </form>

        <Link
          to={mode === "login" ? "/signup" : "/login"}
          className="links text-brand-secondary hover:underline"
        >
          {mode === "login"
            ? "Don't have an account? Sign Up"
            : "Already have an account? Log In"}
        </Link>
      </div>
    </div>
  );
}