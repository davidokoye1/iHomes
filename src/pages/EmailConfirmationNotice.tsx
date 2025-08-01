// src/components/EmailConfirmationNotice.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface Props {
  email?: string;
  onClose: () => void;
}

export default function EmailConfirmationNotice({ email, onClose }: Props) {
  const [resending, setResending] = useState(false);

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('No email address provided');
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Confirmation email sent! Please check your inbox.');
    } catch (error: any) {
      console.error('Error resending confirmation:', error);
      toast.error(error.message || 'Failed to resend confirmation email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-blue-500 text-4xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We've sent a confirmation link to{' '}
            <span className="font-semibold">{email}</span>. 
            Please click the link in the email to activate your account.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleResendConfirmation}
              disabled={resending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend Confirmation Email'}
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Don't see the email? Check your spam folder or try resending.
          </p>
        </div>
      </div>
    </div>
  );
}