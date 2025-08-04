// src/components/AuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ensureProfileExists, updateEmailConfirmationStatus } from '../utils/profileHandler';
import { toast } from 'sonner';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error: authError } = await supabase.auth.getSession();

        if (authError) {
          console.error('Auth callback error:', authError);
          setError('Authentication failed. Please try again.');
          return;
        }

        if (!data.session?.user) {
          setError('No user session found. Please try signing up again.');
          return;
        }

        const user = data.session.user;
        console.log('User confirmed:', user);

        // Ensure profile exists
        const profileResult = await ensureProfileExists(
          user.id,
          user.email || '',
          {
            full_name: user.user_metadata?.full_name || '',
            role: user.user_metadata?.role || 'user',
            agency_name: user.user_metadata?.agency_name,
            license_number: user.user_metadata?.license_number,
            phone: user.user_metadata?.phone,
            whatsapp_number: user.user_metadata?.whatsapp_number,
            bio: user.user_metadata?.bio,
            website: user.user_metadata?.website,
          }
        );

        if (!profileResult.success) {
          console.error('Failed to create profile:', profileResult.error);
          // Still allow login even if profile creation fails
        }

        // Update email confirmation status
        await updateEmailConfirmationStatus(user.id);

        toast.success('Email confirmed successfully! Welcome to iHomes.');
        navigate('/dashboard', { replace: true });

      } catch (err) {
        console.error('Callback handling error:', err);
        setError('Something went wrong during confirmation. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Confirming your email...
          </h2>
          <p className="text-gray-600">
            Please wait while we set up your account.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Confirmation Failed
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}