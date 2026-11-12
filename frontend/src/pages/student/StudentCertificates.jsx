import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BadgeCheck,
  Check,
  Copy,
  Download,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card, CardContent } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button, { buttonClasses } from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import {
  downloadMyCertificateRequest,
  getMyCertificatesRequest,
} from "../../services/certificates.js";
import { formatDate } from "../../utils/roles.js";

function CertificateCard({ certificate }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const verifyPath = `/verify/${encodeURIComponent(certificate.code)}`;

  async function copyVerificationLink() {
    const url = `${window.location.origin}${verifyPath}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access can be blocked by the browser. The code is still
      // visible on the card so it can be copied manually.
      setCopied(false);
    }
  }

  async function downloadCertificate() {
    setDownloading(true);

    try {
      await downloadMyCertificateRequest(certificate.id);
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
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-brand-500 via-cyan-400 to-emerald-400" />
      <CardContent>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-500/25 bg-brand-500/10 text-brand-300">
              <Award size={22} strokeWidth={1.75} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="success" dot>
                  Certificate issued
                </Badge>
                <span className="text-[11px] text-mist-500">
                  {formatDate(certificate.issuedAt)}
                </span>
              </div>
              <h2 className="mt-2 font-display text-lg font-semibold text-white">
                {certificate.course.title}
              </h2>
              <p className="mt-1 text-xs text-mist-500">
                {certificate.course.category} · {certificate.course.level}
                {certificate.course.durationMinutes
                  ? ` · ${certificate.course.durationMinutes} minutes of content`
                  : ""}
              </p>
              <p className="mt-3 font-mono text-xs tracking-[0.08em] text-cyan-300">
                {certificate.code}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              size="sm"
              icon={Download}
              loading={downloading}
              onClick={downloadCertificate}
            >
              {downloading ? "Preparing" : "Download PDF"}
            </Button>
            <button
              type="button"
              onClick={copyVerificationLink}
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              {copied ? (
                <Check size={14} aria-hidden="true" />
              ) : (
                <Copy size={14} aria-hidden="true" />
              )}
              {copied ? "Link copied" : "Copy link"}
            </button>
            <Link
              to={verifyPath}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Verify
              <ExternalLink size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentCertificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getMyCertificatesRequest()
      .then((response) => {
        if (!active) return;
        setCertificates(response.data.certificates);
        setSummary(response.data.summary);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || "Could not load certificates.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout
      title="Certificates"
      subtitle="Your Kodewar learning workspace"
      navItems={getNavigation(user.role)}
    >
      <PageHeader
        eyebrow="Student workspace"
        title="Certificates"
        description="Certificates are issued automatically by the server when every required lesson, assessment and assignment in a course is complete. Each one has a public code anyone can verify."
      />

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-200"
        >
          {error}
        </div>
      ) : certificates === null ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : certificates.length ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              icon={Award}
              label="Certificates earned"
              value={summary.total}
              hint="One per completed course"
            />
            <StatCard
              icon={BadgeCheck}
              label="Latest certificate"
              value={formatDate(summary.latestIssuedAt, "None yet")}
              tone="success"
              hint="Issued automatically after completion"
            />
          </div>

          <div className="space-y-4">
            {certificates.map((certificate) => (
              <CertificateCard
                key={certificate.id}
                certificate={certificate}
              />
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-ink-700/70 bg-ink-900/40 p-4 text-xs leading-5 text-mist-500">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-emerald-300"
              aria-hidden="true"
            />
            <p>
              Anyone can confirm a certificate with its code on the public
              verification page. Verification shows the recipient, course and
              issue date without exposing account details.
            </p>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Finish every lesson, pass every published assessment and submit every published assignment in a course. The certificate is issued automatically when the server confirms the course is complete."
          action={
            <Link
              to="/student/courses"
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              Continue learning
            </Link>
          }
        />
      )}
    </DashboardLayout>
  );
}
