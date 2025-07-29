// src/pages/ForgotPassword.tsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";
import "../styles/auth.css"; // optional if you're using global auth styles

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError(error.message);
    } else {
      setMessage("Reset link sent! Please check your email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#feffea] px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Forgot Your Password?
        </h2>

        <p className="text-gray-600 text-sm text-center mb-6">
          Enter your email address and we'll send you a reset link.
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd783]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[#7fd783] text-white font-medium hover:bg-[#6fc775] transition-colors"
          >
            Send Reset Link
          </button>
        </form>

        {/* Feedback messages */}
        {message && (
          <p className="text-green-600 text-sm text-center mt-4">{message}</p>
        )}
        {error && (
          <p className="text-red-600 text-sm text-center mt-4">{error}</p>
        )}

        {/* Navigation back to login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-[#7fd783] font-medium hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
