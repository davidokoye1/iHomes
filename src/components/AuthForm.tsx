import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import InputField from "./InputField";
import RoleSelect from "./RoleSelect";
import RememberMeCheckbox from "./RememberMeCheckbox";
import "../styles/auth.css";

interface AuthFormProps {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (selected: { value: string } | null) => {
    setFormData((prev) => ({ ...prev, role: selected?.value || "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        if (signUpError) throw signUpError;

        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user?.id,
          full_name: formData.fullName,
          organization_name: formData.organizationName,
          role: formData.role,
        });
        if (profileError) throw profileError;

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user?.email_confirmed_at) {
          navigate("/email-confirmation");
        } else {
          navigate("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;

        rememberMe
          ? localStorage.setItem("rememberMe", "true")
          : localStorage.removeItem("rememberMe");

        toast.success("Successfully logged in");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate("/dashboard");
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/dashboard");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="auth-container">
      <Toaster richColors position="top-right" />
      <h2 className="auth-title">
        {mode === "login" ? (
          <>
            Log In To Your <br />
            <span className="text-brand-primary">iHomes</span> Account
          </>
        ) : (
          <>
            Create Your <br />
            <span className="text-brand-primary">iHomes</span> Account
          </>
        )}
      </h2>

      <div className="auth-form-wrapper">
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <>
              <InputField
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
              />
              <InputField
                type="text"
                name="organizationName"
                placeholder="Organization Name"
                value={formData.organizationName}
                onChange={handleInputChange}
              />
            </>
          )}

          <InputField
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
          />
          <InputField
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
          />

          {mode === "signup" && (
            <>
              <InputField
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              <RoleSelect value={formData.role} onChange={handleRoleChange} />
            </>
          )}

          {mode === "login" && (
            <div className="flex items-center justify-between w-full">
              <RememberMeCheckbox checked={rememberMe} onChange={setRememberMe} />
              <Link
                to="/forgot-password"
                className="text-brand-secondary text-[16px] whitespace-nowrap"
              >
                Forgot Password?
              </Link>
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Processing..." : mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        <Link
          to={mode === "login" ? "/signup" : "/login"}
          className="links text-brand-secondary"
        >
          {mode === "login"
            ? "Don't have an account? Sign Up"
            : "Already have an account? Log In"}
        </Link>
      </div>
    </div>
  );
}
