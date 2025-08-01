// src/pages/AuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Check for token_hash and type in URL params or hash
        const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash');
        const type = urlParams.get('type') || hashParams.get('type');
        
        if (!tokenHash || !type) {
          setError('Invalid confirmation link. Please request a new confirmation email.');
          setLoading(false);
          return;
        }

        console.log('Processing confirmation with:', { tokenHash, type });

        // Verify the email confirmation
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any
        });

        if (error) {
          console.error('Email verification error:', error);
          setError(error.message || 'Email confirmation failed. The link may have expired.');
          setLoading(false);
          return;
        }

        if (data.user) {
          console.log('Email confirmed successfully for user:', data.user.id);
          
          // Wait a moment for the session to be established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get the fresh session
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error after confirmation:', sessionError);
            setError('Confirmation successful, but failed to establish session. Please try logging in.');
            setLoading(false);
            return;
          }

          if (sessionData.session?.user?.email_confirmed_at) {
            // Success! Redirect to dashboard
            navigate('/dashboard', { replace: true });
          } else {
            setError('Email confirmed but session not properly established. Please try logging in.');
            setLoading(false);
          }
        } else {
          setError('Email confirmation failed. Please try again.');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An error occurred during email confirmation');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Confirming your email...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}