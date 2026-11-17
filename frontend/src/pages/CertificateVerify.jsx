import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  CalendarDays,
  Download,
  GraduationCap,
  Search,
  ShieldCheck,
} from "lucide-react";
import BrandLogo from "../components/ui/BrandLogo.jsx";
import Input from "../components/ui/Input.jsx";
import Button, { buttonClasses } from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  downloadVerifiedCertificateRequest,
  getCertificateVerificationRequest,
} from "../services/certificates.js";
import { formatDate } from "../utils/roles.js";

function VerifiedCertificate({ certificate }) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  async function downloadCertificate() {
    setDownloading(true);

    try {
      await downloadVerifiedCertificateRequest(certificate.code);
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not download certificate",
        description: requestError.message || "Please try again.",
      });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-emerald-400/20 bg-ink-900/70 shadow-2xl shadow-black/30">
      <div className="h-1.5 bg-gradient-to-r from-brand-500 via-cyan-400 to-emerald-400" />

      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <BadgeCheck size={14} aria-hidden="true" />
            Valid certificate
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] tracking-[0.08em] text-mist-500">
              {certificate.code}
            </span>
            <Button
              size="sm"
              variant="secondary"
              icon={Download}
              loading={downloading}
              onClick={downloadCertificate}
            >
              {downloading ? "Preparing" : "Download PDF"}
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-500/25 bg-brand-500/10 text-brand-300">
            <Award size={30} strokeWidth={1.5} aria-hidden="true" />
          </span>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-mist-500">
            Certificate of completion
          </p>
          <p className="mt-2 text-xs text-mist-500">This certifies that</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
            {certificate.recipientName}
          </h1>
          <p className="mt-5 text-xs text-mist-500">
            has successfully completed
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-brand-200 sm:text-2xl">
            {certificate.course.title}
          </h2>
        </div>

        <div className="mt-8 grid gap-3 border-t border-ink-800 pt-5 text-left sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
              Category
            </p>
            <p className="mt-1 text-sm text-mist-200">
              {certificate.course.category}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
              Level
            </p>
            <p className="mt-1 text-sm text-mist-200">
              {certificate.course.level}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
              Issued
            </p>
            <p className="mt-1 text-sm text-mist-200">
              {formatDate(certificate.issuedAt)}
            </p>
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2 text-[11px] leading-5 text-mist-500">
          <ShieldCheck
            size={14}
            className="mt-0.5 shrink-0 text-emerald-300"
            aria-hidden="true"
          />
          This certificate was issued by Kodewar LMS after the student
          completed every required lesson, assessment and assignment in the
          course.
        </p>
      </div>
    </article>
  );
}

export default function CertificateVerify() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(code ? code.toUpperCase() : "");
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runVerification(rawCode) {
    const normalized = String(rawCode || "").trim().toUpperCase();

    if (!normalized) {
      setCertificate(null);
      setError("Enter the certificate code to verify it.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getCertificateVerificationRequest(normalized);
      setCertificate(response.data.certificate);
    } catch (requestError) {
      setCertificate(null);
      setError(
        requestError.message ||
          "We could not verify this certificate. Check the code and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!code) {
      setCertificate(null);
      setError("");
      return;
    }

    setInput(code.toUpperCase());
    runVerification(code);
    // The code comes from the URL; this effect should run when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function handleSubmit(event) {
    event.preventDefault();
    const normalized = input.trim().toUpperCase();

    if (!normalized) {
      setCertificate(null);
      setError("Enter the certificate code to verify it.");
      return;
    }

    if (normalized !== String(code || "").toUpperCase()) {
      navigate(`/verify/${encodeURIComponent(normalized)}`);
      return;
    }

    runVerification(normalized);
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <Link to="/" aria-label="Kodewar LMS home">
          <BrandLogo />
        </Link>
        <Link
          to="/login"
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 sm:px-8">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">
            Public verification
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-white">
            Verify a Kodewar certificate
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-mist-400">
            Enter the code printed on a certificate to confirm who earned it,
            which course it covers and when it was issued. No account is needed.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-7 flex max-w-xl flex-col gap-3 rounded-xl border border-ink-700/70 bg-ink-900/50 p-4 sm:flex-row sm:items-start"
        >
          <Input
            label="Certificate code"
            icon={GraduationCap}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="KDW-1A2B3C4D5E6F7A8B"
            hint="Codes use the format KDW- followed by 16 letters or numbers."
            autoComplete="off"
            spellCheck={false}
            className="flex-1"
          />
          <Button
            type="submit"
            loading={loading}
            icon={Search}
            className="mt-0.5 w-full sm:w-auto"
          >
            {loading ? "Checking" : "Verify"}
          </Button>
        </form>

        <div className="mt-7">
          {error ? (
            <Alert tone="danger" title="Certificate not found">
              {error}
            </Alert>
          ) : null}

          {certificate ? (
            <VerifiedCertificate certificate={certificate} />
          ) : !error && !loading ? (
            <div className="rounded-xl border border-dashed border-ink-700 bg-ink-900/30 px-6 py-10 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-ink-700 bg-ink-900 text-brand-300">
                <CalendarDays size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-display text-base font-medium text-white">
                Nothing to verify yet
              </h2>
              <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-mist-500">
                Paste a certificate code above. Verification results show only
                the recipient name, course and issue date.
              </p>
            </div>
          ) : null}
        </div>

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-xs text-mist-500 transition-colors hover:text-mist-200"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          Back to Kodewar LMS
        </Link>
      </main>
    </div>
  );
}
