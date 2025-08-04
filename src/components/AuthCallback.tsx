import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const type = searchParams.get('type');
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const email = searchParams.get('email');

        // Handle email confirmation
        if (type === 'signup' && email) {
          console.log('Processing email confirmation...');
          
          // Show success message
          toast.success('Email confirmed successfully! You can now log in.');
          
          // Wait a moment before redirecting
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }
        
        // Handle email confirmation with token exchange
        if (type === 'email' && accessToken && refreshToken) {
          console.log('Processing email confirmation with token exchange...');
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            console.error('Email confirmation session error:', sessionError);
            throw sessionError;
          }
          
          if (data.user) {
            console.log('Email confirmed and session established');
            toast.success('Email confirmed successfully! Redirecting to dashboard...');
            
            // Update user's email_confirmed status
            await supabase
              .from('profiles')
              .update({ email_confirmed: true })
              .eq('id', data.user.id);
            
            // Redirect after a short delay
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 2000);
          } else {
            throw new Error('No user data received after confirmation');
          }
        }
        // Handle password reset
        else if (type === 'recovery' && accessToken && refreshToken) {
          console.log('Processing password reset...');
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            console.error('Password reset session error:', sessionError);
            throw sessionError;
          }
          
          if (data.user) {
            console.log('Password reset session established');
            toast.success('Please set your new password');
            navigate('/auth/update-password', { replace: true });
          } else {
            throw new Error('No user data received for password reset');
          }
        }
        // Handle other auth flows or direct access
        else {
          // Check if user is already authenticated
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('User already authenticated, redirecting to dashboard');
            navigate('/dashboard', { replace: true });
          } else {
            console.log('No valid auth callback detected, redirecting to login');
            navigate('/login', { replace: true });
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'An error occurred during authentication';
        console.error('Auth callback error:', message);
        setError(message);
        toast.error('Authentication failed: ' + message);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Processing...
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}