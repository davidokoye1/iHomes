// src/components/AuthForm.tsx - Multi-Step Form Implementation
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import InputField from "./InputField";
import "../styles/auth.css";

interface AuthFormProps {
  mode: "login" | "signup";
}

type UserRole = 'user' | 'agent';

interface FormData {
  fullName: string;
  agencyName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  phone?: string;
  whatsappNumber?: string;
  licenseNumber?: string;
  bio?: string;
  website?: string;
}

interface StepConfig {
  id: string;
  title: string;
  subtitle?: string;
  fields: FieldConfig[];
  validation?: (data: FormData) => string | null;
  showFor?: UserRole[];
}

interface FieldConfig {
  name: keyof FormData;
  type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'textarea' | 'select';
  placeholder: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: (value: string) => string | null;
}

// Configure your form steps here - easily modifiable
const FORM_STEPS: StepConfig[] = [
  {
    id: 'role',
    title: 'What describes you best?',
    subtitle: 'Choose your role to get started',
    fields: [
      {
        name: 'role',
        type: 'select',
        placeholder: 'Select your role',
        required: true,
        options: [
          { value: 'user', label: '🏠 I\'m looking for properties' },
          { value: 'agent', label: '🏢 I\'m a real estate agent' }
        ]
      }
    ]
  },
  {
    id: 'personal',
    title: 'Tell us about yourself',
    subtitle: 'We need some basic information',
    fields: [
      {
        name: 'fullName',
        type: 'text',
        placeholder: 'Your full name',
        required: true,
        validation: (value) => {
          if (value.trim().length < 2) return 'Name must be at least 2 characters';
          return null;
        }
      },
      {
        name: 'email',
        type: 'email',
        placeholder: 'Your email address',
        required: true,
        validation: (value) => {
          if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email';
          return null;
        }
      }
    ]
  },
  {
    id: 'agent-details',
    title: 'Agency Information',
    subtitle: 'Tell us about your real estate business',
    showFor: ['agent'],
    fields: [
      {
        name: 'agencyName',
        type: 'text',
        placeholder: 'Your agency name',
        required: true
      },
      {
        name: 'licenseNumber',
        type: 'text',
        placeholder: 'License number (optional)',
        required: false
      },
      {
        name: 'phone',
        type: 'tel',
        placeholder: 'Business phone number',
        required: false,
        validation: (value) => {
          if (value && !/^\+?[0-9]{7,15}$/.test(value.replace(/\s/g, ''))) {
            return 'Please enter a valid phone number';
          }
          return null;
        }
      }
    ]
  },
  {
    id: 'contact',
    title: 'Contact Information',
    subtitle: 'How can clients reach you? (Optional)',
    showFor: ['agent'],
    fields: [
      {
        name: 'whatsappNumber',
        type: 'tel',
        placeholder: 'WhatsApp number',
        required: false,
        validation: (value) => {
          if (value && !/^\+?[0-9]{7,15}$/.test(value.replace(/\s/g, ''))) {
            return 'Please enter a valid WhatsApp number';
          }
          return null;
        }
      },
      {
        name: 'website',
        type: 'url',
        placeholder: 'Your website (optional)',
        required: false
      },
      {
        name: 'bio',
        type: 'textarea',
        placeholder: 'Brief description about yourself and services (optional)',
        required: false
      }
    ]
  },
  {
    id: 'security',
    title: 'Secure Your Account',
    subtitle: 'Create a strong password',
    fields: [
      {
        name: 'password',
        type: 'password',
        placeholder: 'Create a password (min 8 characters)',
        required: true,
        validation: (value) => {
          if (value.length < 8) return 'Password must be at least 8 characters';
          if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
          }
          return null;
        }
      },
      {
        name: 'confirmPassword',
        type: 'password',
        placeholder: 'Confirm your password',
        required: true
      }
    ],
    validation: (data) => {
      if (data.password !== data.confirmPassword) {
        return 'Passwords do not match';
      }
      return null;
    }
  }
];

// Login steps (much simpler)
const LOGIN_STEPS: StepConfig[] = [
  {
    id: 'login',
    title: 'Welcome Back!',
    subtitle: 'Sign in to your iHomes account',
    fields: [
      {
        name: 'email',
        type: 'email',
        placeholder: 'Your email address',
        required: true
      },
      {
        name: 'password',
        type: 'password',
        placeholder: 'Your password',
        required: true
      }
    ]
  }
];

export default function AuthForm({ mode }: AuthFormProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    agencyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    phone: "",
    whatsappNumber: "",
    licenseNumber: "",
    bio: "",
    website: "",
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const steps = mode === 'signup' ? FORM_STEPS : LOGIN_STEPS;
  const currentStep = steps[currentStepIndex];

  // Filter steps based on user role
  const getFilteredSteps = () => {
    if (mode === 'login') return LOGIN_STEPS;
    
    return FORM_STEPS.filter(step => 
      !step.showFor || step.showFor.includes(formData.role)
    );
  };

  const filteredSteps = getFilteredSteps();
  const isLastStep = currentStepIndex === filteredSteps.length - 1;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateCurrentStep = () => {
    const step = filteredSteps[currentStepIndex];
    
    // Check field-level validation
    for (const field of step.fields) {
      const value = formData[field.name] as string || '';
      
      if (field.required && !value.trim()) {
        toast.error(`${field.placeholder} is required`);
        return false;
      }
      
      if (field.validation && value) {
        const error = field.validation(value);
        if (error) {
          toast.error(error);
          return false;
        }
      }
    }
    
    // Check step-level validation
    if (step.validation) {
      const error = step.validation(formData);
      if (error) {
        toast.error(error);
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    
    // If role was just selected, we need to recalculate filtered steps
    if (currentStep.id === 'role') {
      const newFilteredSteps = getFilteredSteps();
      setCurrentStepIndex(1); // Move to next step in filtered list
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStepIndex(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);

    try {
      if (mode === "signup") {
        console.log("Starting signup process with email confirmation...");
        
        const redirectUrl = `${window.location.origin}/auth/callback`;
        


        // Step 1: Create the auth user WITHOUT metadata to avoid trigger issues
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl
          },
        });

        console.log("Signup response:", { data, error: signUpError });

        if (signUpError) {
          console.error("Signup error details:", signUpError);
          
          if (signUpError.message.includes("User already registered")) {
            toast.error("An account with this email already exists. Please try logging in instead.");
            return;
          } else if (signUpError.message.includes("Invalid email")) {
            toast.error("Please enter a valid email address");
            return;
          }
          
          throw signUpError;
        }
        
        if (!data.user) {
          throw new Error("User creation failed - no user data returned");
        }

        // Step 2: Create the profile manually after user creation
        try {
          const profileData: any = {
            id: data.user.id,
            email: formData.email.trim(),
            full_name: formData.fullName.trim(),
            role: formData.role,
            email_confirmed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Add role-specific data for agents
          if (formData.role === 'agent') {
            profileData.agency_name = formData.agencyName?.trim() || null;
            profileData.license_number = formData.licenseNumber?.trim() || null;
            profileData.phone = formData.phone?.replace(/\s/g, '') || null;
            profileData.whatsapp_number = formData.whatsappNumber?.replace(/\s/g, '') || null;
            profileData.bio = formData.bio?.trim() || null;
            profileData.website = formData.website?.trim() || null;
          }

          const { error: profileError } = await supabase
            .from('profiles')
            .insert(profileData);

          if (profileError) {
            console.error("Profile creation error:", profileError);
            // Don't fail the signup process for profile creation errors
            toast.warning("Account created but profile setup incomplete. You can complete it later.");
          } else {
            console.log("Profile created successfully");
          }
        } catch (profileErr) {
          console.error("Error creating profile:", profileErr);
          // Don't fail the signup process
        }

        console.log("User created successfully, confirmation email sent");
        setEmailSent(true);
        toast.success("Account created! Please check your email to confirm your account.");
        
      } else {
        // Login logic
        console.log("Attempting login...");
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (loginError) {
          console.error("Login error:", loginError);
          
          if (loginError.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please check your credentials and try again.");
          } else if (loginError.message.includes("Email not confirmed")) {
            toast.error("Please confirm your email address before logging in. Check your inbox for the confirmation link.");
          } else {
            toast.error(loginError.message || "Login failed. Please try again.");
          }
          return;
        }

        if (!data.user) {
          toast.error("Login failed - no user data received");
          return;
        }

        if (!data.user.email_confirmed_at) {
          toast.error("Please confirm your email address before logging in. Check your inbox for the confirmation link.");
          return;
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
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let errorMessage = "Something went wrong. Please try again.";
      
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

      if (error) throw error;
      toast.success("Confirmation email sent! Please check your inbox.");
    } catch (error: any) {
      console.error("Error resending confirmation:", error);
      toast.error(error.message || "Failed to resend confirmation email");
    } finally {
      setLoading(false);
    }
  };

  // Session check and auth state listener (same as before)
  useEffect(() => {
    let mounted = true;

    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user && session.user.email_confirmed_at) {
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

  // Show email confirmation message
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
          </div>
        </div>
      </div>
    );
  }

  const renderField = (field: FieldConfig) => {
    const value = formData[field.name] as string || '';

    if (field.type === 'select') {
      return (
        <select
          name={field.name}
          value={value}
          onChange={handleInputChange}
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          required={field.required}
        >
          <option value="">{field.placeholder}</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          name={field.name}
          placeholder={field.placeholder}
          value={value}
          onChange={handleInputChange}
          rows={4}
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
          required={field.required}
        />
      );
    }

    return (
      <InputField
        type={field.type}
        name={field.name}
        placeholder={field.placeholder}
        value={value}
        onChange={handleInputChange}
        required={field.required}
      />
    );
  };

  return (
    <div className="auth-container">
      <Toaster richColors position="top-right" />

      {/* Progress indicator for signup */}
      {mode === 'signup' && (
        <div className="mb-8">
          <div className="flex justify-center space-x-2">
            {filteredSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index <= currentStepIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            Step {currentStepIndex + 1} of {filteredSteps.length}
          </p>
        </div>
      )}

      <h2 className="auth-title">
        {currentStep.title}
      </h2>

      {currentStep.subtitle && (
        <p className="text-center text-gray-600 mb-8 text-lg">
          {currentStep.subtitle}
        </p>
      )}

      <div className="auth-form-wrapper">
        <div className="auth-form space-y-6">
          {currentStep.fields.map((field) => (
            <div key={field.name}>
              {renderField(field)}
            </div>
          ))}

          {/* Navigation buttons */}
          <div className="flex flex-col space-y-4">
            {mode === 'login' || isLastStep ? (
              <button 
                onClick={handleSubmit}
                className="auth-button" 
                disabled={loading}
              >
                {loading 
                  ? (mode === "login" ? "Signing in..." : "Creating account...") 
                  : (mode === "login" ? "Sign In" : "Create Account")
                }
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="auth-button"
                type="button"
              >
                Continue
              </button>
            )}

            {/* Back button for multi-step signup */}
            {mode === 'signup' && currentStepIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-lg"
                type="button"
              >
                Back
              </button>
            )}
          </div>
        </div>

        <Link
          to={mode === "login" ? "/signup" : "/login"}
          className="links text-brand-secondary hover:underline mt-6 block text-center"
        >
          {mode === "login"
            ? "Don't have an account? Sign Up"
            : "Already have an account? Sign In"}
        </Link>

        {mode === "login" && (
          <div className="text-center mt-4 space-y-2">
            <Link
              to="/auth/reset-password"
              className="block text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Forgot your password?
            </Link>
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