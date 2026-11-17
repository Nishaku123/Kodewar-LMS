import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card, CardContent, CardHeader } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import { formatDate, roleLabel } from "../../utils/roles.js";
import {
  createManagedUserRequest,
  getUserDirectoryRequest,
  updateUserRoleRequest,
  updateUserStatusRequest,
} from "../../services/manage.js";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  password: "",
  role: "student",
};

/**
 * Administrator-only account directory.
 * Admins can create staff accounts, change any account's role and suspend
 * or reactivate access. Their own row is locked so an administrator cannot
 * accidentally remove their own access.
 */
export default function StaffUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadUsers = useCallback(async (query) => {
    setStatus("loading");
    setError("");

    try {
      const response = await getUserDirectoryRequest(query);
      setUsers(response.data.users);
      setRoles(response.data.roles);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message || "Could not load user accounts.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(search), 250);
    return () => clearTimeout(timer);
  }, [search, loadUsers]);

  const roleOptions =
    roles.length > 0
      ? roles.map((role) => ({
          value: role.name,
          label: roleLabel(role.name),
        }))
      : [
          { value: "student", label: "Student" },
          { value: "trainer", label: "Trainer" },
          { value: "admin", label: "Administrator" },
        ];

  function replaceUser(updated) {
    setUsers((current) =>
      current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
    );
  }

  async function changeRole(target, role) {
    if (role === target.role) return;

    setBusyId(target.id);

    try {
      const response = await updateUserRoleRequest(target.id, role);
      replaceUser(response.data.user);
      toast({
        tone: "success",
        title: "Role updated",
        description: `${response.data.user.fullName} is now ${roleLabel(role)}.`,
      });
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not change role",
        description: requestError.message,
      });
    } finally {
      setBusyId(null);
    }
  }

  async function changeStatus() {
    if (!confirm) return;

    setConfirmLoading(true);

    try {
      const response = await updateUserStatusRequest(
        confirm.user.id,
        confirm.nextStatus
      );
      replaceUser(response.data.user);
      toast({
        tone: "success",
        title:
          confirm.nextStatus === "active" ? "Access restored" : "Account suspended",
        description: response.message,
      });
      setConfirm(null);
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not update access",
        description: requestError.message,
      });
    } finally {
      setConfirmLoading(false);
    }
  }

  async function createUser(event) {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const response = await createManagedUserRequest(form);
      setUsers((current) => [response.data.user, ...current]);
      toast({
        tone: "success",
        title: "Account created",
        description: `${response.data.user.fullName} can now sign in as ${roleLabel(
          response.data.user.role
        )}.`,
      });
      setForm(EMPTY_FORM);
      setCreateOpen(false);
    } catch (requestError) {
      setFormError(requestError.message || "Could not create this account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout
      title="Users & roles"
      subtitle="Administrator access management"
      navItems={getNavigation(user.role)}
    >
      <PageHeader
        eyebrow="Administrator"
        title="Users & roles"
        description="Create accounts and control who can sign in as a student, trainer or administrator."
        actions={
          <Button
            icon={UserPlus}
            onClick={() => {
              setForm(EMPTY_FORM);
              setFormError("");
              setCreateOpen(true);
            }}
          >
            Add user
          </Button>
        }
      />

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <Input
            label="Search"
            icon={Search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            className="sm:max-w-md"
          />
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => loadUsers(search)}
            className="sm:ml-auto"
          >
            Refresh
          </Button>
        </CardContent>
      </Card>

      {status === "loading" ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : status === "error" ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-200"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => loadUsers(search)}
            className="mt-3 font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : users.length ? (
        <Card>
          <CardHeader
            title={`${users.length} account${users.length === 1 ? "" : "s"}`}
            description="Role changes take effect on the account's next request."
          />
          <CardContent className="space-y-2">
            {users.map((account) => {
              const isSelf = String(account.id) === String(user.id);
              const busy = busyId === account.id;

              return (
                <div
                  key={account.id}
                  className="flex flex-col gap-3 rounded-lg border border-ink-800 bg-ink-950/30 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-900 text-brand-300">
                      {account.role === "admin" ? (
                        <ShieldCheck size={15} aria-hidden="true" />
                      ) : (
                        <Users size={15} aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-mist-100">
                          {account.fullName}
                        </p>
                        <Badge
                          tone={
                            account.status === "active" ? "success" : "danger"
                          }
                        >
                          {account.status}
                        </Badge>
                        {isSelf ? <Badge tone="brand">You</Badge> : null}
                      </div>
                      <p className="truncate text-[11px] text-mist-500">
                        {account.email} · joined {formatDate(account.createdAt)}
                        {account.lastLoginAt
                          ? ` · last signed in ${formatDate(account.lastLoginAt)}`
                          : " · never signed in"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-40">
                      <Select
                        aria-label={`Role for ${account.fullName}`}
                        value={account.role}
                        options={roleOptions}
                        disabled={isSelf || busy}
                        onChange={(event) =>
                          changeRole(account, event.target.value)
                        }
                      />
                    </div>
                    <Button
                      variant={account.status === "active" ? "danger" : "secondary"}
                      size="sm"
                      disabled={isSelf || busy}
                      loading={busy}
                      onClick={() =>
                        setConfirm({
                          user: account,
                          nextStatus:
                            account.status === "active" ? "suspended" : "active",
                        })
                      }
                    >
                      {account.status === "active" ? "Suspend" : "Reactivate"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={UserCog}
          title="No accounts found"
          description={
            search
              ? "Try a different name or email address."
              : "Create an account to give someone access."
          }
        />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add user"
        description="The new account can sign in immediately with this password."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" form="create-user-form" loading={saving}>
              Create account
            </Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={createUser} className="space-y-3">
          <Input
            label="Full name"
            required
            value={form.fullName}
            onChange={(event) =>
              setForm((current) => ({ ...current, fullName: event.target.value }))
            }
            placeholder="e.g. Meera Iyer"
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="name@example.com"
          />
          <Input
            label="Temporary password"
            type="password"
            required
            hint="At least 8 characters with a letter and a number."
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
          />
          <Select
            label="Role"
            value={form.role}
            options={roleOptions}
            onChange={(event) =>
              setForm((current) => ({ ...current, role: event.target.value }))
            }
          />

          {formError ? (
            <p role="alert" className="text-xs text-rose-300">
              {formError}
            </p>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={
          confirm?.nextStatus === "active" ? "Restore access" : "Suspend account"
        }
        description={
          confirm
            ? `${confirm.user.fullName} · ${confirm.user.email}`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirm(null)}
              disabled={confirmLoading}
            >
              Cancel
            </Button>
            <Button
              variant={confirm?.nextStatus === "active" ? "primary" : "danger"}
              loading={confirmLoading}
              onClick={changeStatus}
            >
              {confirm?.nextStatus === "active" ? "Reactivate" : "Suspend"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-mist-300">
          {confirm?.nextStatus === "active"
            ? "This account will be able to sign in again immediately."
            : "This account will be signed out on its next request and cannot sign in until it is reactivated."}
        </p>
      </Modal>
    </DashboardLayout>
  );
}
