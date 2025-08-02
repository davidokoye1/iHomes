// src/components/AuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing auth callback...');
        
        // Get the access token and refresh token from URL parameters
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle errors from the auth provider
        if (error) {
          console.error('Auth callback error:', error, errorDescription);
          setError(errorDescription || error);
          setLoading(false);
          return;
        }

        // Handle email confirmation
        if (type === 'signup' && accessToken && refreshToken) {
          console.log('Processing email confirmation...');
          
          // Set the session with the tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
          }

          if (data.user) {
            console.log('Email confirmed successfully for user:', data.user.email);
            
            // Update the profile to mark email as confirmed
            try {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                  email_confirmed: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', data.user.id);

              if (updateError) {
                console.error('Error updating profile:', updateError);
                // Don't fail the confirmation for this
              }
            } catch (profileError) {
              console.error('Profile update error:', profileError);
              // Don't fail the confirmation for this
            }

            toast.success('Email confirmed successfully! Welcome to iHomes!');
            
            // Redirect to dashboard after a short delay
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
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An error occurred during authentication');
        toast.error('Authentication failed: ' + (err.message || 'Unknown error'));
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
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="w-full px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                Create New Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state (while redirecting)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="text-green-500 text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Success!
          </h2>
          <p className="text-gray-600 mb-4">
            Your account has been confirmed successfully.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    </div>
  );
}