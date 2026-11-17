import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import BrandLogo from "../components/ui/BrandLogo.jsx";

/**
 * Split-screen layout for login, registration and password reset pages.
 * The form is supplied as children by each auth page.
 */
export default function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-ink-800 bg-ink-900 p-10 lg:flex">
        <div
          className="app-backdrop absolute inset-0 opacity-80"
          aria-hidden="true"
        />

        <div className="relative">
          <Link to="/" aria-label="Kodewar LMS home" className="inline-block">
            <BrandLogo />
          </Link>
        </div>

        <div className="relative max-w-md">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">
            <span className="h-px w-8 bg-brand-500" aria-hidden="true" />
            Kodewar Learning Platform
          </p>

          <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight text-white">
            Structured learning,
            <br />
            verified progress.
          </h2>

          <p className="mt-4 text-sm leading-6 text-mist-400">
            Weekly modules, practical assessments and certificates that prove
            what you have actually completed.
          </p>

          <ul className="mt-8 space-y-4">
            <li className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10 text-brand-300">
                <ShieldCheck size={16} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-mist-200">
                  Progress you can trust
                </p>
                <p className="mt-0.5 text-xs leading-5 text-mist-500">
                  Learning rules are checked by the server, not just the
                  interface.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                <Sparkles size={16} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-mist-200">
                  Focused, not crowded
                </p>
                <p className="mt-0.5 text-xs leading-5 text-mist-500">
                  Clear weekly goals and one next action at a time.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-mist-500">
          © {new Date().getFullYear()} Kodewar Technologies
        </p>
      </aside>

      <main className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Link to="/" aria-label="Kodewar LMS home">
            <BrandLogo />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-md">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">
                {eyebrow}
              </p>
            ) : null}

            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>

            {description ? (
              <p className="mt-2 text-sm leading-6 text-mist-400">
                {description}
              </p>
            ) : null}

            <div className="mt-8">{children}</div>

            {footer ? (
              <div className="mt-6 text-sm text-mist-400">{footer}</div>
            ) : null}

            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 text-xs text-mist-500 transition-colors hover:text-mist-200"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              Back to status page
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
