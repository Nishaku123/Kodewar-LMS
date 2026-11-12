import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, FlaskConical, Mail } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Alert from "../../components/ui/Alert.jsx";
import { buttonClasses } from "../../components/ui/Button.jsx";
import { forgotPasswordRequest } from "../../services/auth.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldError("");
    setFormError("");

    if (!EMAIL_PATTERN.test(email.trim())) {
      setFieldError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = await forgotPasswordRequest(email.trim().toLowerCase());
      setResult(payload);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setResult(null);
    setEmail("");
  }

  return (
    <AuthLayout
      eyebrow="Password help"
      title="Reset your password"
      description="Enter the email address on your account. We will create a single-use reset link that expires in 30 minutes."
      footer={
        <p>
          Remembered it?{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-300 transition-colors hover:text-brand-200"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        {formError ? (
          <Alert tone="danger" title="Could not create a reset link">
            {formError}
          </Alert>
        ) : null}

        {result ? (
          <div className="space-y-4">
            <Alert tone="success" title="Request received">
              {result.message}
            </Alert>

            {result.data?.resetUrl ? (
              <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-amber-100">
                  <FlaskConical size={14} aria-hidden="true" />
                  Development shortcut
                </p>
                <p className="mt-1.5 text-[11px] leading-5 text-amber-200/80">
                  Email delivery is not connected yet. In development the API
                  returns the reset link so the flow can be tested. This link
                  is never returned in production.
                </p>
                <Link
                  to={`/reset-password?token=${result.data.resetToken}`}
                  className={buttonClasses({
                    variant: "secondary",
                    size: "sm",
                    className: "mt-3",
                  })}
                >
                  Open reset link
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <p className="text-xs leading-5 text-mist-500">
                Check your inbox and spam folder for the reset link.
              </p>
            )}

            <Button variant="ghost" size="sm" onClick={startOver}>
              Use a different email
            </Button>
          </div>
        ) : (
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
              error={fieldError}
              required
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitting}
              iconRight={ArrowRight}
            >
              {submitting ? "Creating link" : "Send reset link"}
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs text-mist-500 transition-colors hover:text-mist-200"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
