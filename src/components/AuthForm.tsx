// src/components/AuthForm.tsx - Enhanced with Brand Design
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import InputField from "./InputField";
import RememberMeCheckbox from "./RememberMeCheckbox";
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
  rememberMe?: boolean;
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
  label?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: (value: string, formData: FormData) => string | null;
  hint?: string;
}

// Enhanced field validation functions
const validationRules = {
  email: (value: string) => {
    if (!value.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },
  
  password: (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters long';
    if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
    return null;
  },
  
  confirmPassword: (value: string, formData: FormData) => {
    if (!value) return 'Please confirm your password';
    if (value !== formData.password) return 'Passwords do not match';
    return null;
  },
  
  fullName: (value: string) => {
    if (!value.trim()) return 'Full name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    return null;
  },
  
  phone: (value: string) => {
    if (!value) return null; // Optional field
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
      return 'Please enter a valid phone number';
    }
    return null;
  },
  
  agencyName: (value: string) => {
    if (!value.trim()) return 'Agency name is required';
    if (value.trim().length < 2) return 'Agency name must be at least 2 characters';
    return null;
  }
};

// Enhanced form configuration
const FORM_STEPS: StepConfig[] = [
  {
    id: 'role',
    title: 'Welcome to iHomes! 🏠',
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
        placeholder: 'Full Name',
        required: true,
        validation: validationRules.fullName
      },
      {
        name: 'email',
        type: 'email',
        placeholder: 'Email',
        required: true,
        validation: validationRules.email
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
        placeholder: 'Agency Name',
        required: true,
        validation: validationRules.agencyName
      },
      {
        name: 'licenseNumber',
        type: 'text',
        placeholder: 'License Number (Optional)',
        required: false
      },
      {
        name: 'phone',
        type: 'tel',
        placeholder: 'Business Phone',
        required: false,
        validation: validationRules.phone
      }
    ]
  },
  {
    id: 'contact',
    title: 'Additional Contact Options',
    subtitle: 'More ways for clients to reach you',
    showFor: ['agent'],
    fields: [
      {
        name: 'whatsappNumber',
        type: 'tel',
        placeholder: 'WhatsApp Number (Optional)',
        required: false,
        validation: validationRules.phone
      },
      {
        name: 'website',
        type: 'url',
        placeholder: 'Website (Optional)',
        required: false
      },
      {
        name: 'bio',
        type: 'textarea',
        placeholder: 'Tell clients about your experience...',
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
        placeholder: 'Password',
        required: true,
        validation: validationRules.password
      },
      {
        name: 'confirmPassword',
        type: 'password',
        placeholder: 'Confirm Password',
        required: true,
        validation: validationRules.confirmPassword
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

const LOGIN_STEPS: StepConfig[] = [
  {
    id: 'login',
    title: 'Log In To Your',
    subtitle: 'iHomes Account',
    fields: [
      {
        name: 'email',
        type: 'email',
        placeholder: 'Email',
        required: true,
        validation: validationRules.email
      },
      {
        name: 'password',
        type: 'password',
        placeholder: 'Password',
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
    rememberMe: false,
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();

  // Memoized filtered steps
  const filteredSteps = useMemo(() => {
    if (mode === 'login') return LOGIN_STEPS;
    return FORM_STEPS.filter(step => 
      !step.showFor || step.showFor.includes(formData.role)
    );
  }, [mode, formData.role]);

  const currentStep = filteredSteps[currentStepIndex];
  const isLastStep = currentStepIndex === filteredSteps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Enhanced input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [fieldErrors]);

  // Enhanced validation
  const validateField = useCallback((field: FieldConfig, value: string): string | null => {
    if (field.required && !value.trim()) {
      return `${field.placeholder} is required`;
    }
    
    if (!field.required && !value.trim()) {
      return null;
    }
    
    if (field.validation) {
      return field.validation(value, formData);
    }
    
    return null;
  }, [formData]);

  const validateCurrentStep = useCallback(() => {
    const step = filteredSteps[currentStepIndex];
    const errors: Record<string, string> = {};
    let hasErrors = false;
    
    for (const field of step.fields) {
      const value = formData[field.name] as string || '';
      const error = validateField(field, value);
      
      if (error) {
        errors[field.name] = error;
        hasErrors = true;
      }
    }
    
    if (step.validation) {
      const stepError = step.validation(formData);
      if (stepError) {
        toast.error(stepError);
        hasErrors = true;
      }
    }
    
    setFieldErrors(errors);
    return !hasErrors;
  }, [currentStepIndex, filteredSteps, formData, validateField]);

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) return;
    setCurrentStepIndex(prev => Math.min(prev + 1, filteredSteps.length - 1));
    setFieldErrors({});
  }, [validateCurrentStep, filteredSteps.length]);

  const handlePrevious = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
    setFieldErrors({});
  }, []);

  // Enhanced submit handler
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);

    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/auth/callback`;
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: formData.fullName.trim(),
              role: formData.role
            }
          },
        });

        if (signUpError) {
          if (signUpError.message.includes("User already registered")) {
            toast.error("An account with this email already exists. Try logging in instead.");
            setTimeout(() => navigate("/login"), 2000);
            return;
          }
          throw signUpError;
        }
        
        if (!data.user) {
          throw new Error("User creation failed - please try again");
        }

        // Create profile
        try {
          const profileData = {
            id: data.user.id,
            email: formData.email.trim().toLowerCase(),
            full_name: formData.fullName.trim(),
            role: formData.role,
            email_confirmed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...(formData.role === 'agent' && {
              agency_name: formData.agencyName?.trim() || null,
              license_number: formData.licenseNumber?.trim() || null,
              phone: formData.phone?.replace(/\s/g, '') || null,
              whatsapp_number: formData.whatsappNumber?.replace(/\s/g, '') || null,
              bio: formData.bio?.trim() || null,
              website: formData.website?.trim() || null
            })
          };

          await supabase.from('profiles').insert(profileData);
        } catch (profileErr) {
          console.error("Profile creation error:", profileErr);
        }

        setEmailSent(true);
        toast.success("Account created successfully! Please check your email to confirm your account.");
        
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });

        if (loginError) {
          if (loginError.message.includes("Invalid login credentials")) {
            setFieldErrors({ 
              email: "Invalid email or password",
              password: "Invalid email or password"
            });
          } else if (loginError.message.includes("Email not confirmed")) {
            toast.error("Please confirm your email address first.");
            setEmailSent(true);
          } else {
            toast.error(loginError.message || "Login failed. Please try again.");
          }
          return;
        }

        if (!data.user?.email_confirmed_at) {
          toast.error("Please confirm your email address before logging in.");
          setEmailSent(true);
          return;
        }

        toast.success("Welcome back!");
        
        // Update last login
        try {
          await supabase
            .from('profiles')
            .update({ 
              last_login_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id);
        } catch (error) {
          console.error("Error updating last login:", error);
        }

        setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Session management
  useEffect(() => {
    let mounted = true;

    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user?.email_confirmed_at) {
            navigate("/dashboard", { replace: true });
            return;
          }
          setSessionChecked(true);
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted) setSessionChecked(true);
      }
    };

    checkInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && sessionChecked) {
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          navigate("/dashboard", { replace: true });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, sessionChecked]);

  // Loading state
  if (!sessionChecked) {
    return (
      <div className="auth-container">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7fd783] mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Email confirmation state
  if (emailSent) {
    return (
      <div className="auth-container">
        <Toaster richColors position="top-right" />
        <div className="text-center">
          <div className="text-6xl mb-6">📧</div>
          <h2 className="auth-title mb-4">Check Your Email</h2>
          <p className="text-gray-600 mb-6 text-lg">
            We've sent a confirmation link to <span className="font-semibold text-[#7fd783]">{formData.email}</span>.
            Please click the link to activate your account.
          </p>
          
          <div className="auth-form">
            <button className="auth-button mb-4">
              Resend Confirmation Email
            </button>
            <Link to="/login" className="links">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced field renderer
  const renderField = (field: FieldConfig) => {
    const value = formData[field.name] as string || '';
    const hasError = fieldErrors[field.name];

    if (field.type === 'select') {
      return (
        <div key={field.name}>
          <select
            name={field.name}
            value={value}
            onChange={handleInputChange}
            className={`auth-input ${hasError ? 'border-red-500' : ''}`}
            required={field.required}
          >
            <option value="">{field.placeholder}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {hasError && <p className="text-red-500 text-sm mt-2 ml-4">{hasError}</p>}
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.name}>
          <textarea
            name={field.name}
            placeholder={field.placeholder}
            value={value}
            onChange={handleInputChange}
            rows={4}
            className={`auth-input resize-none h-32 ${hasError ? 'border-red-500' : ''}`}
            required={field.required}
          />
          {hasError && <p className="text-red-500 text-sm mt-2 ml-4">{hasError}</p>}
        </div>
      );
    }

    return (
      <div key={field.name}>
        <InputField
          type={field.type}
          name={field.name}
          placeholder={field.placeholder}
          value={value}
          onChange={handleInputChange}
          className={hasError ? 'border-red-500' : ''}
        />
        {hasError && <p className="text-red-500 text-sm mt-2 ml-4">{hasError}</p>}
      </div>
    );
  };

  return (
    <div className="auth-container">
      <Toaster richColors position="top-right" />

      {/* Progress indicator for signup - Added responsive container */}
      {mode === 'signup' && (
        <div className="progress-container flex justify-center space-x-2 mb-6">
          {filteredSteps.map((_, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  index < currentStepIndex ? 'bg-[#7fd783]' :
                  index === currentStepIndex ? 'bg-[#7fd783] ring-4 ring-[#7fd783]/30' :
                  'bg-gray-300'
                }`}
              />
              {index < filteredSteps.length - 1 && (
                <div
                  className={`h-0.5 w-8 mx-2 transition-colors duration-300 ${
                    index < currentStepIndex ? 'bg-[#7fd783]' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Enhanced header */}
      <div className="text-center mb-8">
        {mode === 'login' && currentStep.subtitle ? (
          <>
            <h1 className="auth-title">{currentStep.title}</h1>
            <h2 className="text-2xl font-medium mb-4">
              <span className="text-[#7fd783]">{currentStep.subtitle.split(' ')[0]}</span>
              <span className="text-black"> {currentStep.subtitle.split(' ').slice(1).join(' ')}</span>
            </h2>
          </>
        ) : (
          <>
            <h1 className="auth-title mb-2">{currentStep.title}</h1>
            {currentStep.subtitle && (
              <p className="text-gray-600 text-lg">{currentStep.subtitle}</p>
            )}
          </>
        )}
      </div>

      <div className="auth-form-wrapper">
        <div className="auth-form">
          {/* Form fields */}
          {currentStep.fields.map((field) => renderField(field))}

          {/* Remember me checkbox for login */}
          {mode === 'login' && (
            <div className="flex items-center justify-between mb-4">
              <RememberMeCheckbox
                checked={formData.rememberMe || false}
                onChange={(checked) => setFormData(prev => ({ ...prev, rememberMe: checked }))}
              />
              <Link to="/forgot-password" className="small-links">
                Forgot Password?
              </Link>
            </div>
          )}

          {/* Primary action button */}
          {mode === 'login' || isLastStep ? (
            <button 
              onClick={handleSubmit}
              className="auth-button mb-4" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{mode === "login" ? "Logging in..." : "Creating account..."}</span>
                </div>
              ) : (
                mode === "login" ? "Log in" : "Sign Up"
              )}
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className="auth-button mb-4"
              type="button"
            >
              Continue
            </button>
          )}

          {/* Back button for multi-step signup */}
          {mode === 'signup' && !isFirstStep && (
            <button
              onClick={handlePrevious}
              className="w-full px-6 py-4 text-gray-600 border border-gray-300 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-medium text-lg mb-4"
              type="button"
            >
              Back
            </button>
          )}
        </div>

        {/* Footer link */}
        <Link
          to={mode === "login" ? "/signup" : "/login"}
          className="links"
        >
          {mode === "login"
            ? "Don't have an account? Sign Up"
            : "Already have an account? Sign In"}
        </Link>
      </div>
    </div>
  );
}