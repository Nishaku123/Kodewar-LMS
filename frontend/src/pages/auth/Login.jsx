import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Alert from "../../components/ui/Alert.jsx";
import DemoAccounts from "../../components/auth/DemoAccounts.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { roleHome } from "../../utils/roles.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      description: "Press Sign in to continue.",
    });
  }

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back"
      description="Use your Kodewar account to continue learning or manage your workspace."
      footer={
        <p>
          New to Kodewar?{" "}
          <Link
            to="/register"
            className="font-semibold text-brand-300 transition-colors hover:text-brand-200"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        {formError ? (
          <Alert tone="danger" title="Could not sign you in">
            {formError}
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Email address"
            type="email"
            icon={Mail}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            error={fieldErrors.email}
            required
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label
                htmlFor="login-password"
                className="text-xs font-medium text-mist-300"
              >
                Password
                <span className="ml-1 text-brand-300" aria-hidden="true">
                  *
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-medium text-brand-300 transition-colors hover:text-brand-200"
              >
                Forgot password?
              </Link>
            </div>

            <Input
              id="login-password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              error={fieldErrors.password}
              required
            />
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={submitting}
            iconRight={ArrowRight}
          >
            {submitting ? "Signing in" : "Sign in"}
          </Button>
        </form>

        <div className="flex items-center gap-2 rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2.5 text-[11px] leading-5 text-mist-500">
          <ShieldCheck
            size={14}
            className="shrink-0 text-emerald-300"
            aria-hidden="true"
          />
          Your session is stored in a secure, httpOnly cookie. Passwords are
          hashed and never stored as plain text.
        </div>

        <DemoAccounts
          onSelect={handleDemoSelect}
          activeEmail={email.trim().toLowerCase()}
        />
      </div>
    </AuthLayout>
  );
}
