import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Lock,
  Send,
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
import { getAssignmentsRequest } from "../../services/assignments.js";
import { formatDate } from "../../utils/roles.js";

function statusFor(assignment) {
  if (!assignment.isUnlocked) {
    return { label: "Locked", tone: "neutral", icon: Lock };
  }

  if (assignment.submission?.status === "graded") {
    return { label: "Graded", tone: "success", icon: CheckCircle2 };
  }

  if (assignment.submission) {
    return { label: "Submitted", tone: "info", icon: Send };
  }

  return { label: "Available", tone: "brand", icon: ClipboardList };
}

function AssignmentRow({ assignment }) {
  const status = statusFor(assignment);
  const StatusIcon = status.icon;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ink-800 bg-ink-950/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
          <span className="text-[11px] text-mist-500">
            Week {assignment.weekNumber} · {assignment.moduleTitle}
          </span>
          {assignment.isPastDue && !assignment.submission ? (
            <Badge tone="warning">Past due</Badge>
          ) : null}
          {assignment.isLate ? (
            <Badge tone="warning">Submitted late</Badge>
          ) : null}
        </div>
        <h3 className="mt-2 font-medium text-white">{assignment.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-mist-500">
          {assignment.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mist-500">
          <span>{assignment.maxPoints} points</span>
          {assignment.dueAt ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={12} aria-hidden="true" />
              Due {formatDate(assignment.dueAt)}
            </span>
          ) : (
            <span>No due date</span>
          )}
          {assignment.submission?.status === "graded" ? (
            <span>
              Score {assignment.submission.score} of {assignment.maxPoints}
            </span>
          ) : null}
        </div>
      </div>

      <div className="shrink-0">
        {assignment.isUnlocked ? (
          <Link
            to={`/student/assignments/${assignment.id}`}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            {assignment.submission ? "View submission" : "Open assignment"}
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

export default function StudentAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getAssignmentsRequest()
      .then((response) => {
        if (!active) return;
        setAssignments(response.data.assignments);
        setSummary(response.data.summary);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || "Could not load assignments.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const groups = useMemo(() => {
    if (!assignments) return [];

    const map = new Map();

    for (const assignment of assignments) {
      if (!map.has(assignment.courseId)) {
        map.set(assignment.courseId, {
          courseId: assignment.courseId,
          courseTitle: assignment.courseTitle,
          items: [],
        });
      }
      map.get(assignment.courseId).items.push(assignment);
    }

    return [...map.values()];
  }, [assignments]);

  return (
    <DashboardLayout
      title="Assignments"
      subtitle="Your Kodewar learning workspace"
      navItems={getNavigation(user.role)}
    >
      <PageHeader
        eyebrow="Student workspace"
        title="Assignments"
        description="Practical tasks unlock after the lessons in their week. Submit written work and an optional link; trainers grade submissions."
      />

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-200"
        >
          {error}
        </div>
      ) : assignments === null ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : assignments.length ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="Assignments"
              value={summary.total}
              hint="Across your enrolled courses"
            />
            <StatCard
              icon={Send}
              label="Submitted"
              value={summary.submitted}
              tone="cyan"
              hint="Including graded work"
            />
            <StatCard
              icon={CheckCircle2}
              label="Graded"
              value={summary.graded}
              tone="success"
              hint="Feedback has been left"
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
                      {group.items.length === 1 ? "assignment" : "assignments"}
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
                  {group.items.map((assignment) => (
                    <AssignmentRow
                      key={assignment.id}
                      assignment={assignment}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="Assignments appear here when a course you are enrolled in has a published task."
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
