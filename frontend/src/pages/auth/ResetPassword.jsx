import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import Input from "../../components/ui/Input.jsx";
import Button, { buttonClasses } from "../../components/ui/Button.jsx";
import Alert from "../../components/ui/Alert.jsx";
import { resetPasswordRequest } from "../../services/auth.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { refresh } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function validate() {
    const errors = {};

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
      await resetPasswordRequest({ token, password });
      // The API clears the auth cookie. Refresh the context so a stale
      // signed-in user is not kept in memory after the reset.
      await refresh();
      setDone(true);
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
      eyebrow="Password help"
      title={done ? "Password updated" : "Choose a new password"}
      description={
        done
          ? "Your password was changed and the reset link can no longer be used."
          : "Choose a strong password you have not used before. The link works once and expires after 30 minutes."
      }
      footer={
        <p>
          Need a new link?{" "}
          <Link
            to="/forgot-password"
            className="font-semibold text-brand-300 transition-colors hover:text-brand-200"
          >
            Request another
          </Link>
        </p>
      }
    >
      {!token ? (
        <div className="space-y-4">
          <Alert tone="warning" title="This link is missing its token">
            Reset links include a unique token. Open the link from your email
            again, or request a new one.
          </Alert>
          <Link
            to="/forgot-password"
            className={buttonClasses({ variant: "primary", size: "lg", fullWidth: true })}
          >
            Request a reset link
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : done ? (
        <div className="space-y-4">
          <Alert tone="success" title="Your password was reset">
            You can now sign in with your new password.
          </Alert>
          <Link
            to="/login"
            className={buttonClasses({ variant: "primary", size: "lg", fullWidth: true })}
          >
            Go to sign in
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {formError ? (
            <Alert tone="danger" title="Could not reset your password">
              {formError}
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="New password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              hint="At least 8 characters, including a letter and a number."
              error={fieldErrors.password}
              autoFocus
              required
            />

            <Input
              label="Confirm new password"
              type="password"
              icon={Lock}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat the new password"
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
              required
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitting}
              iconRight={CheckCircle2}
            >
              {submitting ? "Updating password" : "Update password"}
            </Button>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}
