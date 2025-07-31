// src/components/EmailConfirmation.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../styles/auth.css";

export default function EmailConfirmation() {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  // For future localization
  const messages = {
    en: "Please check your email to confirm your account. Follow the instructions in the email to complete your registration.",
    fr: "Veuillez vérifier votre email pour confirmer votre compte. Suivez les instructions dans l'email pour finaliser votre inscription.",
  };
  const selectedLanguage = "en";

  // Poll Supabase every 3s to check if email is confirmed
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) return console.error("Error checking confirmation:", error.message);

      if (data.user?.email_confirmed_at) {
        clearInterval(interval);
        navigate("/dashboard");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  // Animate progress bar gradually
  useEffect(() => {
    const animation = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 2 : prev)); // Stops at 90% until confirmed
    }, 500);

    return () => clearInterval(animation);
  }, []);

  return (
    <div className="auth-container">
      <h2 className="auth-title">
        Email Confirmation
        <br />
        <span className="text-brand-primary">iHomes</span>
      </h2>

      <div className="auth-form-wrapper">
        <div className="auth-form">
          <p className="text-center text-[20px] text-[#333333]">
            {messages[selectedLanguage as keyof typeof messages]}
          </p>

          {/* Progress bar */}
          <div className="w-full max-w-[200px] mx-auto mt-6">
            <div className="w-full bg-[#8b8b8b56] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#7fd783] h-2 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-[14px] text-[#333333] mt-2">
              Processing confirmation...
            </p>
          </div>

          {/* Back to login */}
          <Link to="/login" className="links text-brand-secondary mt-4 block text-center">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}