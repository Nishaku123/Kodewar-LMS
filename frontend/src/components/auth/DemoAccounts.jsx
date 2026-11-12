import { FlaskConical, ShieldCheck } from "lucide-react";
import { ROLE_LABELS } from "../../utils/roles.js";
import { cn } from "../../utils/cn.js";

/**
 * Development-only list of seeded demo accounts.
 * Clicking a row fills the form. Nothing signs in automatically, so the
 * normal login flow is still exercised.
 */
export const DEMO_ACCOUNTS = [
  { role: "student", email: "student@kodewar.test", password: "Student@123" },
  { role: "trainer", email: "trainer@kodewar.test", password: "Trainer@123" },
  { role: "admin", email: "admin@kodewar.test", password: "Admin@123" },
];

export default function DemoAccounts({ onSelect, activeEmail, className }) {
  if (!import.meta.env.DEV) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-ink-700/80 bg-ink-900/60 p-4",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/10 text-amber-200">
          <FlaskConical size={15} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold text-mist-100">
            Development demo accounts
          </p>
          <p className="mt-0.5 text-[11px] leading-5 text-mist-500">
            Seeded by <code className="text-mist-300">npm run db:seed</code>.
            Click a role to fill the form, then sign in.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => onSelect(account)}
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
              activeEmail === account.email
                ? "border-brand-500/40 bg-brand-500/10"
                : "border-ink-700 bg-ink-950/50 hover:border-ink-600 hover:bg-ink-800/60"
            )}
          >
            <span className="inline-flex items-center gap-2 text-[11px] font-medium text-mist-200">
              <ShieldCheck
                size={13}
                className="text-brand-300"
                aria-hidden="true"
              />
              {ROLE_LABELS[account.role] || account.role}
            </span>
            <span className="text-[10px] text-mist-500">Fill</span>
          </button>
        ))}
      </div>
    </div>
  );
}
