// src/components/AuthForm.tsx - Enhanced with Email Confirmation
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import InputField from "./InputField";
import RoleSelect from "./RoleSelect";
import RememberMeCheckbox from "./RememberMeCheckbox";
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
  const [emailSent, setEmailSent] = useState(false);
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
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return false;
      }
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return false;
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        toast.error("Password must contain at least one uppercase letter, one lowercase letter, and one number");
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
        console.log("Starting signup process with email confirmation...");
        
        // Get the current site URL for email confirmation
        const redirectUrl = `${window.location.origin}/auth/callback`;
        
        // Sign up the user WITH email confirmation
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName.trim(),
              role: formData.role,
              organization_name: formData.organizationName.trim() || null,
            },
            emailRedirectTo: redirectUrl
          },
        });

        console.log("Signup response:", { data, error: signUpError });

        if (signUpError) {
          console.error("Signup error details:", signUpError);
          
          // Handle specific signup errors
          if (signUpError.message.includes("User already registered")) {
            toast.error("An account with this email already exists. Please try logging in instead.");
            return;
          } else if (signUpError.message.includes("Invalid email")) {
            toast.error("Please enter a valid email address");
            return;
          } else if (signUpError.message.includes("Password")) {
            toast.error("Password does not meet requirements");
            return;
          }
          
          throw signUpError;
        }
        
        if (!data.user) {
          throw new Error("User creation failed - no user data returned");
        }

        console.log("User created successfully, confirmation email sent");
        setEmailSent(true);
        toast.success("Account created! Please check your email to confirm your account.");
        
      } else {
        // Login
        console.log("Attempting login...");
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (loginError) {
          console.error("Login error:", loginError);
          
          // Handle specific login errors
          if (loginError.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please check your credentials and try again.");
          } else if (loginError.message.includes("Email not confirmed")) {
            toast.error("Please confirm your email address before logging in. Check your inbox for the confirmation link.");
          } else if (loginError.message.includes("signups not allowed")) {
            toast.error("New signups are currently disabled. Please contact support.");
          } else {
            toast.error(loginError.message || "Login failed. Please try again.");
          }
          return;
        }

        if (!data.user) {
          toast.error("Login failed - no user data received");
          return;
        }

        // Check if email is confirmed
        if (!data.user.email_confirmed_at) {
          toast.error("Please confirm your email address before logging in. Check your inbox for the confirmation link.");
          return;
        }

        // Handle remember me
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }

        console.log("Login successful");
        toast.success("Successfully logged in!");
        
        // Update last login time
        try {
          await supabase
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', data.user.id);
        } catch (error) {
          console.error("Error updating last login:", error);
          // Don't fail login for this
        }

        // Navigation will be handled by the auth state change listener
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let errorMessage = "Something went wrong. Please try again.";
      
      // Handle network errors
      if (err.message && err.message.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationEmail = async () => {
    if (!formData.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      toast.success("Confirmation email sent! Please check your inbox.");
    } catch (error: any) {
      console.error("Error resending confirmation:", error);
      toast.error(error.message || "Failed to resend confirmation email");
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
          if (session?.user && session.user.email_confirmed_at) {
            // User is authenticated and email confirmed - go to dashboard
            console.log("User already authenticated, redirecting to dashboard");
            navigate("/dashboard", { replace: true });
            return;
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

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email_confirmed_at);
      
      if (mounted && sessionChecked) {
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          console.log("User signed in with confirmed email, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        } else if (event === 'SIGNED_IN' && !session?.user?.email_confirmed_at) {
          console.log("User signed in but email not confirmed");
          toast.warning("Please confirm your email address to continue");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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

  // Show email confirmation message if email was sent
  if (emailSent && mode === "signup") {
    return (
      <div className="auth-container">
        <Toaster richColors position="top-right" />
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-green-500 text-5xl mb-4">📧</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Check Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              We've sent a confirmation link to <strong>{formData.email}</strong>. 
              Please click the link to activate your account.
            </p>
            <div className="space-y-3">
              <button
                onClick={resendConfirmationEmail}
                disabled={loading}
                className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {loading ? "Sending..." : "Resend Confirmation Email"}
              </button>
              <Link
                to="/login"
                className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Back to Login
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Didn't receive the email? Check your spam folder or click resend.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <Toaster richColors position="top-right" />

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
                required
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
            required
          />
          
          <InputField
            type="password"
            name="password"
            placeholder={mode === "signup" ? "Password (min 8 characters) *" : "Password *"}
            value={formData.password}
            onChange={handleInputChange}
            required
          />

          {mode === "signup" && (
            <>
              <InputField
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              <RoleSelect
                value={formData.role}
                onChange={handleRoleChange}
              />
              <div className="text-sm text-gray-600 text-center">
                By signing up, you agree to receive email confirmations and updates about your account.
              </div>
            </>
          )}

          {mode === "login" && (
            <div className="flex items-center justify-between w-full">
              <RememberMeCheckbox 
                checked={rememberMe} 
                onChange={setRememberMe} 
              />
              <Link
                to="/auth/reset-password"
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

        {mode === "login" && (
          <div className="text-center mt-4">
            <button
              onClick={resendConfirmationEmail}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Resend confirmation email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}