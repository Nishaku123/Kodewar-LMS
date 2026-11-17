import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, CheckCircle2, KeyRound, UserRound } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card, CardHeader, CardContent } from "../../components/ui/Card.jsx";
import { buttonClasses } from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import { getMyCoursesRequest } from "../../services/courses.js";
import {
  formatDate,
  formatDateTime,
  roleLabel,
} from "../../utils/roles.js";

const liveFeatures = [
  {
    icon: CheckCircle2,
    title: "Session verified by the server",
    description:
      "This page only renders after GET /api/auth/me confirms the signed-in account.",
  },
  {
    icon: UserRound,
    title: "Profile editing works",
    description: "Update your display name from the profile page and it is saved in TiDB.",
  },
  {
    icon: KeyRound,
    title: "Password changes work",
    description:
      "Change your password securely from the profile page; the current password is required.",
  },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState(null);
  const [coursesError, setCoursesError] = useState("");
  const firstName = user.fullName.split(" ")[0];

  useEffect(() => {
    let active = true;

    getMyCoursesRequest()
      .then((response) => {
        if (active) setCourses(response.data.courses);
      })
      .catch((error) => {
        if (active) {
          setCoursesError(error.message || "Could not load your courses.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout
      title="Overview"
      subtitle="Your Kodewar learning workspace"
      navItems={getNavigation(user.role)}
    >
      <PageHeader
        eyebrow="Student workspace"
        title={`Welcome back, ${firstName}`}
        description="Your learning space is ready. Browse published courses and open your weekly lessons from My courses."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="relative overflow-hidden border-brand-500/20 bg-gradient-to-br from-brand-500/[0.10] via-ink-900/60 to-cyan-400/[0.03] lg:col-span-2">
          <div
            className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:32px_32px]"
            aria-hidden="true"
          />
          <CardContent className="relative p-6 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="success" dot>
                Signed in
              </Badge>
              <Badge tone="brand">{roleLabel(user.role)}</Badge>
            </div>

            <h2 className="mt-4 max-w-xl font-display text-2xl font-semibold leading-snug tracking-tight text-white">
              Keep building your skills, one lesson at a time.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-mist-400">
              Browse the course catalogue, enrol in a course and continue
              learning from its weekly modules and lessons.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/student/courses"
                className={buttonClasses({ variant: "primary", size: "sm" })}
              >
                Open my courses
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
              <Link
                to="/account"
                className={buttonClasses({ variant: "secondary", size: "sm" })}
              >
                Manage profile
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Account"
            description="Loaded from the users table"
            action={<Badge tone="neutral">{user.status}</Badge>}
          />
          <CardContent className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                Name
              </p>
              <p className="mt-1 truncate text-sm font-medium text-mist-100">
                {user.fullName}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                Email
              </p>
              <p className="mt-1 truncate text-sm text-mist-200">{user.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-ink-800 pt-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                  Joined
                </p>
                <p className="mt-1 text-xs text-mist-200">
                  {formatDate(user.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                  Last sign in
                </p>
                <p className="mt-1 text-xs text-mist-200">
                  {formatDateTime(user.lastLoginAt)}
                </p>
              </div>
            </div>
            <Link
              to="/account"
              className={buttonClasses({
                variant: "secondary",
                size: "sm",
                fullWidth: true,
              })}
            >
              Edit profile
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Learning snapshot"
            description="Your enrolled courses from the learning catalogue"
            action={<Badge tone="brand">Learning</Badge>}
          />
          <CardContent>
            {coursesError ? (
              <p role="alert" className="text-sm text-rose-200">
                {coursesError}
              </p>
            ) : courses === null ? (
              <p className="text-sm text-mist-500">Loading your courses…</p>
            ) : courses.length ? (
              <div className="space-y-3">
                {courses.slice(0, 3).map((course) => (
                  <Link
                    key={course.id}
                    to={`/student/courses/${course.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-ink-800 px-3 py-3 transition-colors hover:border-ink-600"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-mist-100">
                        {course.title}
                      </span>
                      <span className="mt-1 block text-xs text-mist-500">
                        {course.lessonCount} lessons ·{" "}
                        {course.progressPercent ?? 0}% complete
                        {course.assessmentCount
                          ? ` · ${course.assessmentCount} assessments`
                          : ""}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={15}
                      className="shrink-0 text-brand-300"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
                <Link
                  to="/student/courses"
                  className={buttonClasses({
                    variant: "secondary",
                    size: "sm",
                    fullWidth: true,
                  })}
                >
                  Browse all courses
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No courses enrolled yet"
                description="Explore the catalogue and enrol in a published course to start learning."
                action={
                  <Link
                    to="/student/courses"
                    className={buttonClasses({ variant: "secondary", size: "sm" })}
                  >
                    Explore courses
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="What already works"
            description="Each item below is live in this build"
          />
          <CardContent>
            <ul className="space-y-4">
              {liveFeatures.map((feature) => (
                <li key={feature.title} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                    <feature.icon size={15} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-mist-100">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-mist-500">
                      {feature.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
