import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  BookOpenCheck,
  Users,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card, CardContent, CardHeader } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import { buttonClasses } from "../../components/ui/Button.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import { formatDate, roleLabel } from "../../utils/roles.js";
import { getManagedCoursesRequest } from "../../services/manage.js";

const roleCopy = {
  trainer: {
    icon: BookOpenCheck,
    title: "Trainer workspace",
    description:
      "Author courses, build weekly lessons and assessments, and grade student submissions.",
  },
  admin: {
    icon: Users,
    title: "Administrator workspace",
    description:
      "Oversee courses and enrolments, review student progress, manage platform content and control user access.",
  },
};

export default function StaffHome() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const firstName = user.fullName.split(" ")[0];
  const details = roleCopy[user.role] || roleCopy.admin;
  const Icon = details.icon;

  const loadCourses = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      const response = await getManagedCoursesRequest();
      setCourses(response.data.courses);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message || "Could not load workspace data.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const published = courses.filter((course) => course.isPublished).length;
  const enrollments = courses.reduce(
    (total, course) => total + (Number(course.enrollmentCount) || 0),
    0
  );
  const recentCourses = courses.slice(0, 5);

  return (
    <DashboardLayout
      title="Workspace"
      subtitle="Staff authoring and student progress"
      navItems={getNavigation(user.role)}
    >
      <PageHeader
        eyebrow="Staff workspace"
        title={`Welcome, ${firstName}`}
        description={details.description}
        actions={
          <Link
            to="/staff/courses"
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            Manage courses
          </Link>
        }
      />

      {status === "error" ? (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={loadCourses}
            className="mt-2 font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {status === "loading" ? (
          Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={BookOpen}
              label="Courses"
              value={courses.length}
              hint={`${published} published · ${courses.length - published} drafts`}
            />
            <StatCard
              icon={Users}
              label="Enrolments"
              value={enrollments}
              hint="Across all courses"
              tone="cyan"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader
            title="Recent courses"
            description="Open a course to edit modules, lessons and assessments."
            action={
              <Link
                to="/staff/courses"
                className="text-xs font-semibold text-brand-300 underline underline-offset-4"
              >
                View all
              </Link>
            }
          />
          <CardContent className="space-y-2">
            {status === "loading" ? (
              <Skeleton className="h-40 rounded-lg" />
            ) : recentCourses.length ? (
              recentCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/staff/courses/${course.id}`}
                  className="flex flex-col gap-2 rounded-lg border border-ink-800 bg-ink-950/30 px-4 py-3 transition-colors hover:border-brand-500/40 hover:bg-brand-500/[0.04] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-mist-100">
                        {course.title}
                      </p>
                      <Badge
                        tone={course.isPublished ? "success" : "warning"}
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[11px] text-mist-500">
                      {Number(course.enrollmentCount) || 0} students · created{" "}
                      {formatDate(course.createdAt)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-brand-300">
                    Open →
                  </span>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-ink-800 px-4 py-8 text-center">
                <p className="text-sm text-mist-300">No courses yet.</p>
                <Link
                  to="/staff/courses"
                  className={buttonClasses({
                    variant: "primary",
                    size: "sm",
                    className: "mt-4",
                  })}
                >
                  Create the first course
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-brand-500/20 bg-gradient-to-br from-brand-500/[0.08] to-cyan-400/[0.02]">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="success" dot>
                  Signed in
                </Badge>
                <Badge tone="brand">{roleLabel(user.role)}</Badge>
              </div>

              <span className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-300">
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              </span>

              <h2 className="mt-3 font-display text-lg font-semibold text-white">
                {details.title}
              </h2>
              <p className="mt-2 text-xs leading-5 text-mist-400">
                {user.email}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/staff/students"
                  className={buttonClasses({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  Student progress
                </Link>
                <Link
                  to="/account"
                  className={buttonClasses({
                    variant: "ghost",
                    size: "sm",
                  })}
                >
                  Profile
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Quick actions" />
            <CardContent className="grid gap-2">
              <Link
                to="/staff/courses"
                className="rounded-lg border border-ink-800 bg-ink-950/30 px-3 py-2.5 text-sm text-mist-200 transition-colors hover:border-brand-500/40 hover:text-white"
              >
                Create or edit a course
              </Link>
              <Link
                to="/staff/students"
                className="rounded-lg border border-ink-800 bg-ink-950/30 px-3 py-2.5 text-sm text-mist-200 transition-colors hover:border-brand-500/40 hover:text-white"
              >
                Review student progress
              </Link>
              <Link
                to="/account"
                className="rounded-lg border border-ink-800 bg-ink-950/30 px-3 py-2.5 text-sm text-mist-200 transition-colors hover:border-brand-500/40 hover:text-white"
              >
                Manage your account
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
