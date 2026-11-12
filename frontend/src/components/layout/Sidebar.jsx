import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import BrandLogo from "../ui/BrandLogo.jsx";
import Avatar from "../ui/Avatar.jsx";
import { cn } from "../../utils/cn.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { roleLabel } from "../../utils/roles.js";

/**
 * Shared sidebar content used by the desktop sidebar and the mobile drawer.
 */
export function SidebarContent({
  navItems = [],
  onNavigate,
  showClose = false,
  onClose,
  closeButtonRef,
}) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);

    try {
      await logout();
      toast({ tone: "success", title: "Signed out" });
      onNavigate?.();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between gap-3 border-b border-ink-800/80 px-5">
        <Link
          to="/"
          onClick={onNavigate}
          aria-label="Kodewar LMS home"
          className="rounded-md"
        >
          <BrandLogo />
        </Link>

        {showClose ? (
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-mist-400 transition-colors hover:bg-ink-800 hover:text-white"
          >
            <X size={17} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav
        className="flex-1 overflow-y-auto px-3 py-5"
        aria-label="Main navigation"
      >
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
          Workspace
        </p>

        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-brand-500/10 text-white ring-1 ring-inset ring-brand-500/20"
                      : "text-mist-400 hover:bg-ink-800/70 hover:text-mist-50"
                  )
                }
              >
                <item.icon
                  size={17}
                  strokeWidth={1.85}
                  aria-hidden="true"
                  className="shrink-0"
                />
                <span className="truncate">{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto rounded-full border border-ink-700 bg-ink-800 px-1.5 py-0.5 text-[10px] font-medium text-mist-400">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-ink-800/80 p-4">
        {user ? (
          <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-3.5">
            <div className="flex items-center gap-2.5">
              <Avatar name={user.fullName} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-mist-100">
                  {user.fullName}
                </p>
                <p className="truncate text-[10px] text-mist-500">
                  {roleLabel(user.role)}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/account"
                onClick={onNavigate}
                className="inline-flex h-8 items-center justify-center rounded-md border border-ink-700 bg-ink-950/50 text-[11px] font-medium text-mist-300 transition-colors hover:border-ink-600 hover:text-white"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-ink-700 bg-ink-950/50 text-[11px] font-medium text-mist-300 transition-colors hover:border-rose-400/30 hover:text-rose-200 disabled:opacity-50"
              >
                <LogOut size={12} aria-hidden="true" />
                {signingOut ? "Leaving" : "Sign out"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-3.5">
            <p className="flex items-center gap-2 text-xs font-medium text-mist-200">
              <span
                className="h-1.5 w-1.5 rounded-full bg-brand-400"
                aria-hidden="true"
              />
              Design preview
            </p>
            <p className="mt-1.5 text-[11px] leading-5 text-mist-500">
              This page is a component gallery. Sign in to use the real
              workspace.
            </p>
            <Link
              to="/login"
              onClick={onNavigate}
              className="mt-3 inline-flex text-[11px] font-semibold text-brand-300 transition-colors hover:text-brand-200"
            >
              Go to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ navItems }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-ink-800/80 bg-ink-950 lg:block">
      <SidebarContent navItems={navItems} />
    </aside>
  );
}
