// src/pages/AuthCallbackPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Toaster, toast } from "sonner";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Extract the token from URL
        const params = new URLSearchParams(location.hash.substring(1));
        const token = params.get("confirmation_token");
        const type = params.get("type");
        
        if (!token) {
          throw new Error("Invalid confirmation link");
        }
        
        if (type === "recovery") {
          // Handle password reset
          navigate(`/reset-password?token=${token}`);
          return;
        }
        
        // Verify the email confirmation token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type: "email",
          token_hash: token,
        });
        
        if (verifyError) {
          throw verifyError;
        }
        
        // Check if the user is now confirmed
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error("Could not verify session after email confirmation");
        }
        
        // Update profile to mark email as confirmed
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ email_confirmed: true })
          .eq("id", session.user.id);
        
        if (profileError) {
          console.error("Error updating profile email confirmation:", profileError);
          // Don't fail the entire process for this
        }
        
        toast.success("Email confirmed successfully! You can now log in.");
        navigate("/login?success=true", { replace: true });
      } catch (err: any) {
        console.error("Email confirmation error:", err);
        setError(err.message || "Failed to confirm email");
        toast.error(err.message || "Failed to confirm email. Please try again.");
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Toaster richColors position="top-right" />
      
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <div className="mb-6">
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
          ) : error ? (
            <div className="text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ) : (
            <div className="text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {loading ? "Confirming Email..." : error ? "Confirmation Failed" : "Email Confirmed!"}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {loading 
            ? "Please wait while we verify your email address..." 
            : error 
              ? "There was an issue confirming your email. Please try again or contact support."
              : "Your email has been successfully confirmed. You can now log in to your account."}
        </p>
        
        {!loading && (
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}