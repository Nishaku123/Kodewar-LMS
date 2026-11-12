import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  Lock,
  Target,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card, CardContent } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import { buttonClasses } from "../../components/ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import { getAssessmentsRequest } from "../../services/assessments.js";
import { formatDateTime } from "../../utils/roles.js";

function statusFor(assessment) {
  if (!assessment.isUnlocked) {
    return { label: "Locked", tone: "neutral", icon: Lock };
  }

  if (assessment.passed) {
    return { label: "Passed", tone: "success", icon: CheckCircle2 };
  }

  if (assessment.attemptsUsed > 0) {
    return { label: "Needs another attempt", tone: "warning", icon: Target };
  }

  return { label: "Available", tone: "brand", icon: ListChecks };
}

function AssessmentRow({ assessment }) {
  const status = statusFor(assessment);
  const StatusIcon = status.icon;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ink-800 bg-ink-950/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
          <span className="text-[11px] text-mist-500">
            Week {assessment.weekNumber} · {assessment.moduleTitle}
          </span>
        </div>
        <h3 className="mt-2 font-medium text-white">{assessment.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-mist-500">
          {assessment.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mist-500">
          <span>Pass mark {assessment.passingScore}%</span>
          <span>
            {assessment.attemptsUsed} of {assessment.maxAttempts || "∞"} attempts
            used
          </span>
          {assessment.bestScore !== null ? (
            <span>Best score {assessment.bestScore}%</span>
          ) : null}
          {assessment.lastAttemptAt ? (
            <span>Last attempt {formatDateTime(assessment.lastAttemptAt)}</span>
          ) : null}
        </div>
      </div>

      <div className="shrink-0">
        {assessment.isUnlocked ? (
          <Link
            to={`/student/assessments/${assessment.id}`}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            {assessment.passed ? "Review" : "Open"}
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-ink-800 px-3 py-2 text-xs text-mist-500">
            <StatusIcon size={14} aria-hidden="true" />
            Locked
          </span>
        )}
      </div>
    </div>
  );
}

export default function StudentAssessments() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getAssessmentsRequest()
      .then((response) => {
        if (!active) return;
        setAssessments(response.data.assessments);
        setSummary(response.data.summary);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || "Could not load assessments.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const groups = useMemo(() => {
    if (!assessments) return [];

    const map = new Map();

    for (const assessment of assessments) {
      if (!map.has(assessment.courseId)) {
        map.set(assessment.courseId, {
          courseId: assessment.courseId,
          courseTitle: assessment.courseTitle,
          items: [],
        });
      }
      map.get(assessment.courseId).items.push(assessment);
    }

    return [...map.values()];
  }, [assessments]);

  return (
    <DashboardLayout
      title="Assessments"
      subtitle="Your Kodewar learning workspace"
      navItems={getNavigation(user.role)}
    >
      <PageHeader
        eyebrow="Student workspace"
        title="Assessments"
        description="Weekly quizzes unlock after that week's lessons. Pass mark, attempts and scores are always calculated by the server."
      />

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-200"
        >
          {error}
        </div>
      ) : assessments === null ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : assessments.length ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ClipboardCheck}
              label="Assessments"
              value={summary.total}
              hint="Across your enrolled courses"
            />
            <StatCard
              icon={CheckCircle2}
              label="Passed"
              value={summary.passed}
              tone="success"
              hint="Completed assessment requirements"
            />
            <StatCard
              icon={ListChecks}
              label="Available now"
              value={summary.available}
              tone="cyan"
              hint="Unlocked and not yet passed"
            />
            <StatCard
              icon={Lock}
              label="Locked"
              value={summary.locked}
              tone="warning"
              hint="Finish earlier lessons to unlock"
            />
          </div>

          {groups.map((group) => (
            <Card key={group.courseId}>
              <CardContent>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-medium text-white">
                      {group.courseTitle}
                    </h2>
                    <p className="mt-1 text-xs text-mist-500">
                      {group.items.length}{" "}
                      {group.items.length === 1 ? "assessment" : "assessments"}
                    </p>
                  </div>
                  <Link
                    to={`/student/courses/${group.courseId}`}
                    className={buttonClasses({ variant: "ghost", size: "sm" })}
                  >
                    Open course
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {group.items.map((assessment) => (
                    <AssessmentRow
                      key={assessment.id}
                      assessment={assessment}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardCheck}
          title="No assessments yet"
          description="Assessments appear here when a course you are enrolled in has a published weekly quiz."
          action={
            <Link
              to="/student/courses"
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              Browse my courses
            </Link>
          }
        />
      )}
    </DashboardLayout>
  );
}
