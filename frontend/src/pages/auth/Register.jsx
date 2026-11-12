import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Alert from "../../components/ui/Alert.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { roleHome } from "../../utils/roles.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errors = {};

    if (fullName.trim().length < 2) {
      errors.fullName = "Enter your full name.";
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (password.length < 8) {
      errors.password = "Use at least 8 characters.";
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      errors.password = "Include at least one letter and one number.";
    }

    if (confirmPassword !== password) {
      errors.confirmPassword = "The two passwords do not match.";
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
      const user = await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      toast({
        tone: "success",
        title: "Account created",
        description: "You are signed in as a student.",
      });

      navigate(roleHome(user.role), { replace: true });
    } catch (error) {
      setFormError(error.message);

      if (Array.isArray(error.details)) {
        const nextErrors = {};

        for (const detail of error.details) {
          if (detail?.field) nextErrors[detail.field] = detail.message;
        }

        setFieldErrors(nextErrors);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Start learning with Kodewar"
      description="Registration creates a student account. Trainer and administrator accounts are created by the platform team."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-300 transition-colors hover:text-brand-200"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        {formError ? (
          <Alert tone="danger" title="Could not create your account">
            {formError}
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Full name"
            icon={User}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            error={fieldErrors.fullName}
            required
          />

          <Input
            label="Email address"
            type="email"
            icon={Mail}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            error={fieldErrors.email}
            required
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            hint="At least 8 characters, including a letter and a number."
            error={fieldErrors.password}
            required
          />

          <Input
            label="Confirm password"
            type="password"
            icon={Lock}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            required
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={submitting}
            iconRight={ArrowRight}
          >
            {submitting ? "Creating account" : "Create account"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
