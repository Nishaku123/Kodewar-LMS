import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "../components/ui/BrandLogo.jsx";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <header className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8">
        <BrandLogo />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md rounded-2xl border border-ink-700/80 bg-ink-900/70 p-8 text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-300">
            Error 404
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-white">
            This page does not exist.
          </h1>
          <p className="mt-3 text-sm leading-6 text-mist-400">
            The address may be mistyped, or the page may belong to a phase
            that has not been built yet.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-400"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </main>

      <footer className="border-t border-ink-800/80 px-5 py-6 text-center text-xs text-mist-500 sm:px-8">
        © {new Date().getFullYear()} Kodewar Technologies
      </footer>
    </div>
  );
}
