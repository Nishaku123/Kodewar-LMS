import {
  ArrowUpRight,
  BookOpenCheck,
  Database,
  Layers,
  RotateCw,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/ui/BrandLogo.jsx";
import { useSystemHealth } from "../hooks/useSystemHealth.js";

const highlights = [
  {
    icon: BookOpenCheck,
    title: "Structured learning",
    description:
      "Weekly modules, focused video lessons and assessments with clear unlock rules.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted progress",
    description:
      "Lesson completion and scores are recorded in the database, not only in the browser.",
  },
  {
    icon: Database,
    title: "TiDB foundation",
    description:
      "A relational schema designed for courses, attempts, feedback and certificates.",
  },
];

const toneStyles = {
  up: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]",
  down: "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.45)]",
  checking: "animate-pulse bg-amber-300",
};

function formatUptime(seconds) {
  if (typeof seconds !== "number") return null;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatDatabaseVersion(version) {
  if (!version) return null;
  const match = version.match(/TiDB-v([\d.]+)/i);
  return match ? `TiDB v${match[1]}` : version;
}

function StatusRow({ icon: Icon, label, value, detail, tone }) {
  return (
    <div className="flex items-start gap-3 py-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-700/80 bg-ink-850 text-mist-400">
        <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm font-medium text-mist-200">{label}</dt>
          <dd className="flex items-center gap-2 text-xs font-medium text-mist-300">
            <span
              className={`h-1.5 w-1.5 rounded-full ${toneStyles[tone]}`}
              aria-hidden="true"
            />
            {value}
          </dd>
        </div>
        {detail ? (
          <p
            className="mt-1 break-words text-xs leading-5 text-mist-500"
            title={detail}
          >
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function Foundation() {
  const { status, data, error, check } = useSystemHealth();

  const isLoading = status === "loading";
  const databaseConnected = Boolean(data?.database?.connected);

  const apiTone = isLoading ? "checking" : status === "error" ? "down" : "up";
  const apiValue = isLoading
    ? "Checking"
    : status === "error"
      ? "Offline"
      : "Online";

  const databaseTone = isLoading
    ? "checking"
    : databaseConnected
      ? "up"
      : "down";
  const databaseValue = isLoading
    ? "Checking"
    : databaseConnected
      ? "Connected"
      : status === "error"
        ? "Unknown"
        : "Unavailable";

  const overall =
    isLoading || status === "error"
      ? {
          label: isLoading ? "Checking" : "API offline",
          className:
            "border-amber-300/30 bg-amber-300/10 text-amber-200",
          dot: "bg-amber-300",
        }
      : data?.status === "ok"
        ? {
            label: "Operational",
            className:
              "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
            dot: "bg-emerald-400",
          }
        : {
            label: "Degraded",
            className: "border-rose-400/25 bg-rose-400/10 text-rose-200",
            dot: "bg-rose-400",
          };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <div
        className="app-backdrop pointer-events-none absolute inset-x-0 top-0 h-[620px]"
        aria-hidden="true"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-6 sm:px-8">
        <BrandLogo />

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/design"
            className="hidden rounded-lg px-3 py-1.5 text-xs font-medium text-mist-300 transition-colors hover:bg-ink-800 hover:text-white sm:inline-flex"
          >
            Design system
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-400"
          >
            Sign in
          </Link>
          <span className="hidden rounded-full border border-ink-700/80 bg-ink-900/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-400 sm:inline-flex">
            Phase 3 · Auth
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 pb-16 sm:px-8">
        <section className="relative grid grid-cols-1 gap-12 pt-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-start lg:gap-16 lg:pt-16">
          <div className="min-w-0">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300">
              <span className="h-px w-8 bg-brand-500" aria-hidden="true" />
              Kodewar Learning Platform
            </p>

            <h1 className="mt-6 max-w-xl font-display text-4xl font-semibold leading-[1.06] tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.35rem]">
              Learn with structure.
              <br />
              <span className="text-gradient">Grow with proof.</span>
            </h1>

            <p className="mt-6 max-w-lg text-[15px] leading-7 text-mist-400 sm:text-base">
              A focused learning management system for Kodewar students.
              Follow weekly modules, complete assessments, and earn
              certificates that are backed by real progress.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="/api/health"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-400 focus-visible:bg-brand-400"
              >
                View API health
                <ArrowUpRight size={16} strokeWidth={2.25} aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={check}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900/60 px-4 py-2.5 text-sm font-medium text-mist-200 transition-colors duration-200 hover:border-ink-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCw
                  size={15}
                  className={isLoading ? "animate-spin" : ""}
                  aria-hidden="true"
                />
                {isLoading ? "Checking services" : "Check again"}
              </button>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-mist-300 transition-colors duration-200 hover:text-white"
              >
                Create student account
              </Link>
            </div>

            <ul className="mt-12 grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-4 transition-colors duration-200 hover:border-ink-600/80"
                >
                  <item.icon
                    size={18}
                    strokeWidth={1.75}
                    className="text-brand-300"
                    aria-hidden="true"
                  />
                  <h2 className="mt-3 text-sm font-semibold text-white">
                    {item.title}
                  </h2>
                  <p className="mt-1.5 text-xs leading-5 text-mist-500">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <aside
            aria-labelledby="system-status-title"
            className="relative min-w-0"
          >
            <div
              className="absolute -inset-3 rounded-[26px] bg-brand-500/5 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative overflow-hidden rounded-2xl border border-ink-700/80 bg-ink-900/85 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="flex items-start justify-between gap-4 border-b border-ink-700/70 px-6 py-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mist-500">
                    Live environment
                  </p>
                  <h2
                    id="system-status-title"
                    className="mt-2 font-display text-xl font-medium text-white"
                  >
                    System status
                  </h2>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${overall.className}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${overall.dot}`}
                    aria-hidden="true"
                  />
                  {overall.label}
                </span>
              </div>

              <dl className="divide-y divide-ink-800/80 px-6">
                <StatusRow
                  icon={Server}
                  label="API server"
                  value={apiValue}
                  detail={
                    data
                      ? `Uptime ${formatUptime(data.uptimeSeconds)} · ${data.environment}`
                      : status === "error"
                        ? "Start it with: npm run dev:backend"
                        : "Contacting the Express server"
                  }
                  tone={apiTone}
                />
                <StatusRow
                  icon={Database}
                  label="TiDB database"
                  value={databaseValue}
                  detail={
                    databaseConnected
                      ? `${data.database.name} · ${formatDatabaseVersion(data.database.version)}`
                      : status === "error"
                        ? "Needs the API to be online"
                        : data?.database?.name ||
                          "Verifying the connection pool"
                  }
                  tone={databaseTone}
                />
                <StatusRow
                  icon={Layers}
                  label="Environment"
                  value={data?.environment || (status === "error" ? "Offline" : "—")}
                  detail="Encrypted connection · Rules enforced by the API"
                  tone={status === "error" ? "down" : "up"}
                />
              </dl>

              {status === "error" ? (
                <div
                  role="alert"
                  className="mx-6 mt-4 rounded-xl border border-rose-400/25 bg-rose-400/[0.06] px-4 py-3 text-xs leading-5"
                >
                  <p className="font-medium text-rose-100">
                    The API could not be reached.
                  </p>
                  <p className="mt-1 break-words text-rose-200/80">{error}</p>
                </div>
              ) : null}

              {status === "success" && !databaseConnected ? (
                <div
                  role="alert"
                  className="mx-6 mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-3 text-xs leading-5"
                >
                  <p className="font-medium text-amber-100">
                    The API is online, but TiDB is not connected.
                  </p>
                  <p className="mt-1 text-amber-200/80">
                    Run <code className="text-amber-100">npm run db:check</code>{" "}
                    to verify your database settings.
                  </p>
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-ink-700/70 px-6 py-4">
                <p className="text-xs text-mist-500">
                  Source:{" "}
                  <code className="rounded bg-ink-950 px-1.5 py-0.5 text-[11px] text-mist-300">
                    /api/health
                  </code>
                </p>
                <button
                  type="button"
                  onClick={check}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-mist-300 transition-colors duration-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RotateCw
                    size={13}
                    className={isLoading ? "animate-spin" : ""}
                    aria-hidden="true"
                  />
                  Refresh
                </button>
              </div>
            </div>

            <p className="mt-4 px-1 text-xs leading-5 text-mist-500">
              These are live checks, not sample data. The dashboard, courses
              and certificates will connect to the same API in the next
              phases.
            </p>

            <p className="sr-only" aria-live="polite">
              {`API ${apiValue}. Database ${databaseValue}.`}
            </p>
          </aside>
        </section>
      </main>

      <footer className="border-t border-ink-800/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-mist-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} Kodewar Technologies. Internal
            learning platform.
          </p>
          <Link
            to="/design"
            className="inline-flex items-center gap-1.5 text-mist-500 transition-colors hover:text-white"
          >
            Phase 2 of 10 · Explore the design system
            <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
