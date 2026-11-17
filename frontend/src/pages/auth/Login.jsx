import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Presentation,
  Settings,
} from "lucide-react";
import AuthShowcaseLayout from "../../layouts/AuthShowcaseLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { roleHome } from "../../utils/roles.js";
import { cn } from "../../utils/cn.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const DEMO_ROLES = [
  {
    role: "student",
    label: "Student",
    icon: GraduationCap,
    email: "student@kodewar.test",
    password: "Student@123",
  },
  {
    role: "trainer",
    label: "Trainer",
    icon: Presentation,
    email: "trainer@kodewar.test",
    password: "Trainer@123",
  },
  {
    role: "admin",
    label: "Administrator",
    icon: Settings,
    email: "admin@kodewar.test",
    password: "Admin@123",
  },
];

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function applyServerDetails(error) {
    if (Array.isArray(error.details)) {
      const nextErrors = {};

      for (const detail of error.details) {
        if (detail?.field) nextErrors[detail.field] = detail.message;
      }

      setFieldErrors(nextErrors);
    }
  }

  function validate() {
    const errors = {};

    if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Enter your password.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!validate()) return;

    setSubmitting(true);

    try {
      const user = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      toast({
        tone: "success",
        title: `Welcome back, ${user.fullName.split(" ")[0]}`,
        description: "You are signed in.",
      });

      const destination = location.state?.from || roleHome(user.role);
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(error.message);
      applyServerDetails(error);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDemoSelect(account) {
    setEmail(account.email);
    setPassword(account.password);
    setFieldErrors({});
    setFormError("");
    toast({
      tone: "info",
      title: "Demo credentials filled",
      description: "Press Sign In to continue.",
    });
  }

  return (
    <AuthShowcaseLayout
      footerMobileOnly
      footer={
        <p>
          New to Kodewar?{" "}
          <Link
            to="/register"
            className="font-semibold text-[#075fca] transition-colors hover:text-[#034a9f]"
          >
            Create an account
          </Link>
        </p>
      }
    >
      {/* Brand lockup */}
      <div className="flex items-center justify-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#071d3c] ring-1 ring-[#ffc21b]/70 shadow-[0_0_22px_rgba(27,113,216,0.3)]">
          <img
            src="/kodewar-mark.png"
            alt=""
            className="h-8 w-8 object-contain"
          />
        </span>
        <span className="text-left">
          <span className="block font-display text-[16px] font-semibold leading-none tracking-[0.28em] text-white">
            KODEWAR
          </span>
          <span className="mt-1.5 block text-[9px] font-medium uppercase tracking-[0.4em] text-[#b9a9d6]">
            LMS
          </span>
        </span>
      </div>

      <h1 className="mt-4 text-center font-display text-[26px] font-bold tracking-tight text-white">
        Welcome <span className="text-[#ffc928]">Back</span>
      </h1>
      <p className="mt-1 text-center text-[12.5px] text-[#c3d5eb]">
        Sign in to continue your learning journey.
      </p>

      {formError ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-[11.5px] leading-5 text-rose-200"
        >
          {formError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-[12px] font-medium text-[#e2edfa]"
          >
            Email address
            <span className="ml-1 text-[#ffca28]" aria-hidden="true">
              *
            </span>
          </label>

          <div
            className={cn(
              "auth-field flex h-11 items-center gap-2.5 rounded-lg px-3",
              fieldErrors.email && "auth-field-invalid"
            )}
          >
            <Mail
              size={15}
              strokeWidth={1.7}
              className="shrink-0 text-[#9bc9f5]"
              aria-hidden="true"
            />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
              autoFocus
              required
              aria-invalid={fieldErrors.email ? "true" : undefined}
              aria-describedby={
                fieldErrors.email ? "login-email-error" : undefined
              }
              className="h-full w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[#a4bad4]"
            />
          </div>

          {fieldErrors.email ? (
            <p
              id="login-email-error"
              role="alert"
              className="mt-1.5 text-[11px] text-rose-300"
            >
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        {/* Password */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor="login-password"
              className="text-[12px] font-medium text-[#e2edfa]"
            >
              Password
              <span className="ml-1 text-[#ffca28]" aria-hidden="true">
                *
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] font-medium text-[#35b4ff] transition-colors hover:text-[#8bd5ff]"
            >
              Forgot Password?
            </Link>
          </div>

          <div
            className={cn(
              "auth-field flex h-11 items-center gap-2.5 rounded-lg px-3",
              fieldErrors.password && "auth-field-invalid"
            )}
          >
            <Lock
              size={15}
              strokeWidth={1.7}
              className="shrink-0 text-[#9bc9f5]"
              aria-hidden="true"
            />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              aria-invalid={fieldErrors.password ? "true" : undefined}
              aria-describedby={
                fieldErrors.password ? "login-password-error" : undefined
              }
              className="h-full w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[#a4bad4]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="shrink-0 rounded-md p-0.5 text-[#9bc9f5] transition-colors hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff size={15} aria-hidden="true" />
              ) : (
                <Eye size={15} aria-hidden="true" />
              )}
            </button>
          </div>

          {fieldErrors.password ? (
            <p
              id="login-password-error"
              role="alert"
              className="mt-1.5 text-[11px] text-rose-300"
            >
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="auth-cta mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[14px] font-semibold text-[#071d3c] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
              Signing In
            </>
          ) : (
            <>
              Sign In
              <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      {import.meta.env.DEV ? (
        <>
          <div className="mt-4 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#7894b5] to-[#7894b5]" />
            <span className="whitespace-nowrap text-[10.5px] font-medium text-[#c3d5eb]">
              Development Demo Accounts
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#7894b5] to-[#7894b5]" />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {DEMO_ROLES.map((account) => {
              const Icon = account.icon;
              const isActive = email.trim().toLowerCase() === account.email;

              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleDemoSelect(account)}
                  className={cn(
                    "auth-role flex flex-col items-center gap-1.5 rounded-lg px-1 py-2.5",
                    isActive && "auth-role-active"
                  )}
                >
                  <Icon
                    size={19}
                    strokeWidth={1.6}
                    className={
                      account.role === "admin"
                        ? "text-[#4ade80]"
                        : account.role === "trainer"
                          ? "text-[#43c4ff]"
                          : "text-[#168bff]"
                    }
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-medium text-[#eaf3ff]">
                    {account.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </AuthShowcaseLayout>
  );
}
