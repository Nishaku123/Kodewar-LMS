import { Link } from "react-router-dom";
import { ArrowUpRight, LogIn, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout.jsx";
import Badge from "../components/ui/Badge.jsx";
import { buttonClasses } from "../components/ui/Button.jsx";

const liveItems = [
  {
    icon: ShieldCheck,
    title: "Real role-aware sign in",
    description:
      "Students, trainers and admins sign in with seeded development accounts.",
  },
  {
    icon: Sparkles,
    title: "Secure password flow",
    description:
      "Registration, forgot password and single-use, time-limited reset links are live.",
  },
];

export default function AuthLayoutPreview() {
  return (
    <AuthLayout
      eyebrow="Layout preview · Phase 3"
      title="Authentication is live"
      description="This is the same split-screen layout used by the working sign-in and registration pages."
    >
      <div className="rounded-xl border border-ink-700/80 bg-ink-900/60 p-5">
        <Badge tone="success" dot>
          Working authentication
        </Badge>

        <p className="mt-3 text-sm leading-6 text-mist-300">
          The pages below submit to the Express API, set an httpOnly JWT cookie
          and read the signed-in user from TiDB. Demo accounts are available in
          development.
        </p>

        <ul className="mt-5 space-y-4">
          {liveItems.map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-950 text-brand-300">
                <item.icon size={15} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-mist-200">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-mist-500">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-ink-800 pt-5">
          <Link
            to="/login"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            <LogIn size={13} aria-hidden="true" />
            Open sign in
          </Link>
          <Link
            to="/register"
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            <UserPlus size={13} aria-hidden="true" />
            Create account
          </Link>
          <Link
            to="/design"
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            Design system
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
