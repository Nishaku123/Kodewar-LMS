import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import PageHeader from "../components/layout/PageHeader.jsx";
import { Card, CardHeader, CardContent } from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Alert from "../components/ui/Alert.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getNavigation } from "../config/navigation.js";
import { changePasswordRequest } from "../services/auth.js";
import {
  formatDate,
  formatDateTime,
  roleLabel,
} from "../utils/roles.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Account() {
  const { user, updateProfile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user.fullName);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [signingOut, setSigningOut] = useState(false);

  function collectDetails(error, setter) {
    if (!Array.isArray(error.details)) return;

    const next = {};

    for (const detail of error.details) {
      if (detail?.field) next[detail.field] = detail.message;
    }

    setter(next);
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileError("");
    setProfileErrors({});

    if (fullName.trim().length < 2) {
      setProfileErrors({ fullName: "Enter your full name." });
      return;
    }

    setSavingProfile(true);

    try {
      await updateProfile({ fullName: fullName.trim() });
      toast({
        tone: "success",
        title: "Profile updated",
        description: "Your new display name is saved in TiDB.",
      });
    } catch (error) {
      setProfileError(error.message);
      collectDetails(error, setProfileErrors);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordErrors({});

    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = "Enter your current password.";
    }

    if (newPassword.length < 8) {
      errors.newPassword = "Use at least 8 characters.";
    } else if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      errors.newPassword = "Include at least one letter and one number.";
    }

    if (confirmPassword !== newPassword) {
      errors.confirmPassword = "The two passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setSavingPassword(true);

    try {
      await changePasswordRequest({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        tone: "success",
        title: "Password changed",
        description: "Use your new password the next time you sign in.",
      });
    } catch (error) {
      setPasswordError(error.message);
      collectDetails(error, setPasswordErrors);
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogout() {
    setSigningOut(true);

    try {
      await logout();
      toast({ tone: "success", title: "Signed out" });
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <DashboardLayout
      title="Profile"
      subtitle="Account details and security"
      navItems={getNavigation(user.role)}
    >
      <PageHeader
        eyebrow="Account settings"
        title="Your profile"
        description="These details come from the signed-in account. Changes are saved by the Express API and stored in TiDB."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Personal details"
              description="Your email address is used to sign in and cannot be changed here."
            />
            <CardContent>
              {profileError ? (
                <Alert tone="danger" title="Could not save your profile" className="mb-4">
                  {profileError}
                </Alert>
              ) : null}

              <form onSubmit={handleProfileSubmit} noValidate className="space-y-4">
                <Input
                  label="Full name"
                  icon={UserRound}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  error={profileErrors.fullName}
                  required
                />

                <Input
                  label="Email address"
                  type="email"
                  icon={Mail}
                  value={user.email}
                  readOnly
                  disabled
                  hint="Contact an administrator if you need to change your email."
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="submit"
                    size="sm"
                    loading={savingProfile}
                    disabled={fullName.trim() === user.fullName}
                  >
                    Save changes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setFullName(user.fullName)}
                    disabled={fullName.trim() === user.fullName}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Change password"
              description="Your current password is required. New passwords need at least 8 characters including a letter and a number."
            />
            <CardContent>
              {passwordError ? (
                <Alert tone="danger" title="Could not change your password" className="mb-4">
                  {passwordError}
                </Alert>
              ) : null}

              <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
                <Input
                  label="Current password"
                  type="password"
                  icon={KeyRound}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  error={passwordErrors.currentPassword}
                  required
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="New password"
                    type="password"
                    icon={KeyRound}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    error={passwordErrors.newPassword}
                    required
                  />

                  <Input
                    label="Confirm new password"
                    type="password"
                    icon={KeyRound}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    error={passwordErrors.confirmPassword}
                    required
                  />
                </div>

                <Button type="submit" size="sm" loading={savingPassword}>
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Account summary" />
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-mist-500">Role</span>
                <Badge tone="brand">{roleLabel(user.role)}</Badge>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-mist-500">Status</span>
                <Badge tone={user.status === "active" ? "success" : "danger"} dot>
                  {user.status}
                </Badge>
              </div>

              <div className="border-t border-ink-800 pt-4">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                  <CalendarDays size={11} aria-hidden="true" />
                  Member since
                </p>
                <p className="mt-1 text-xs text-mist-200">
                  {formatDate(user.createdAt)}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                  <ShieldCheck size={11} aria-hidden="true" />
                  Last sign in
                </p>
                <p className="mt-1 text-xs text-mist-200">
                  {formatDateTime(user.lastLoginAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Session"
              description="Signing out clears the httpOnly authentication cookie on this device."
            />
            <CardContent>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                icon={LogOut}
                onClick={handleLogout}
                loading={signingOut}
              >
                Sign out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

