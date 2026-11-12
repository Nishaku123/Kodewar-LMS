import { Link } from "react-router-dom";
import { Home, Menu, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { roleLabel } from "../../utils/roles.js";
import Avatar from "../ui/Avatar.jsx";

export default function Topbar({ title, subtitle, onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-800/80 bg-ink-950/85 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-700 text-mist-300 transition-colors hover:bg-ink-800 hover:text-white lg:hidden"
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-medium text-white">
            {title}
          </p>
          {subtitle ? (
            <p className="truncate text-[11px] text-mist-500">{subtitle}</p>
          ) : null}
        </div>

        {user ? (
          <Link
            to="/account"
            className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/70 py-1 pl-1 pr-2 transition-colors hover:border-ink-600 hover:bg-ink-800"
            aria-label={`Open profile for ${user.fullName}`}
          >
            <Avatar name={user.fullName} size="xs" />
            <span className="hidden text-[11px] font-medium text-mist-300 sm:block">
              {roleLabel(user.role)}
            </span>
          </Link>
        ) : (
          <span className="hidden items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-300 sm:inline-flex">
            <Sparkles size={11} aria-hidden="true" />
            Preview
          </span>
        )}

        <Link
          to="/"
          aria-label="Back to status page"
          title="Back to status page"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-700 text-mist-300 transition-colors hover:bg-ink-800 hover:text-white"
        >
          <Home size={17} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
