import { useCallback, useEffect, useState } from "react";
import { GraduationCap, RefreshCw, Search, Users } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card, CardContent, CardHeader } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Modal from "../../components/ui/Modal.jsx";
import ProgressBar from "../../components/ui/ProgressBar.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import { formatDate } from "../../utils/roles.js";
import {
  getStudentDirectoryRequest,
  getStudentProgressRequest,
} from "../../services/manage.js";

export default function StaffStudents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({
    open: false,
    loading: false,
    data: null,
    error: "",
  });

  const loadStudents = useCallback(async (query) => {
    setStatus("loading");
    setError("");

    try {
      const response = await getStudentDirectoryRequest(query);
      setStudents(response.data.students);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message || "Could not load students.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadStudents(search), 250);
    return () => clearTimeout(timer);
  }, [search, loadStudents]);

  async function openProgress(student) {
    setProgress({ open: true, loading: true, data: null, error: "" });

    try {
      const response = await getStudentProgressRequest(student.id);
      setProgress({
        open: true,
        loading: false,
        data: response.data,
        error: "",
      });
    } catch (requestError) {
      setProgress({
        open: true,
        loading: false,
        data: null,
        error: requestError.message,
      });
      toast({
        tone: "danger",
        title: "Could not load student progress",
        description: requestError.message,
      });
    }
  }

  return (
    <DashboardLayout
      title="Students"
      subtitle="Student directory and progress"
      navItems={getNavigation(user.role)}
    >
      <PageHeader
        eyebrow="Staff workspace"
        title="Students"
        description="Search student accounts and review their progress across every enrolled course."
      />

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <Input
            label="Search"
            icon={Search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            className="sm:max-w-md"
          />
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => loadStudents(search)}
            className="sm:ml-auto"
          >
            Refresh
          </Button>
        </CardContent>
      </Card>

      {status === "loading" ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : status === "error" ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-200"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => loadStudents(search)}
            className="mt-3 font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : students.length ? (
        <Card>
          <CardHeader
            title={`${students.length} student${students.length === 1 ? "" : "s"}`}
            description="Only student accounts are listed here."
          />
          <CardContent className="space-y-2">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex flex-col gap-3 rounded-lg border border-ink-800 bg-ink-950/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-900 text-brand-300">
                    <Users size={15} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-mist-100">
                        {student.fullName}
                      </p>
                      <Badge
                        tone={student.status === "active" ? "success" : "danger"}
                      >
                        {student.status}
                      </Badge>
                    </div>
                    <p className="truncate text-[11px] text-mist-500">
                      {student.email} · joined {formatDate(student.createdAt)} ·{" "}
                      {Number(student.enrollmentCount) || 0} courses
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openProgress(student)}
                >
                  View progress
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No students found"
          description={
            search
              ? "Try a different name or email address."
              : "Student accounts will appear here after registration."
          }
        />
      )}

      <Modal
        open={progress.open}
        onClose={() =>
          setProgress({ open: false, loading: false, data: null, error: "" })
        }
        title="Student progress"
        description={
          progress.data?.student
            ? `${progress.data.student.fullName} · ${progress.data.student.email}`
            : "Progress across enrolled courses"
        }
        size="lg"
      >
        {progress.loading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : progress.error ? (
          <p className="text-sm text-rose-300">{progress.error}</p>
        ) : progress.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-ink-800 bg-ink-950/30 p-4">
                <p className="text-xs text-mist-400">Courses enrolled</p>
                <p className="mt-1 font-display text-xl text-white">
                  {progress.data.overview.coursesEnrolled}
                </p>
              </div>
              <div className="rounded-lg border border-ink-800 bg-ink-950/30 p-4">
                <p className="text-xs text-mist-400">Courses completed</p>
                <p className="mt-1 font-display text-xl text-white">
                  {progress.data.overview.coursesCompleted}
                </p>
              </div>
            </div>

            {progress.data.courses.length ? (
              progress.data.courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-lg border border-ink-800 bg-ink-950/30 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-mist-100">{course.title}</p>
                      <p className="text-[11px] text-mist-500">
                        {course.category} · {course.level}
                      </p>
                    </div>
                    <Badge tone={course.progress.isComplete ? "success" : "neutral"}>
                      {course.progress.isComplete
                        ? "Complete"
                        : `${course.progress.progressPercent}%`}
                    </Badge>
                  </div>
                  <ProgressBar
                    value={course.progress.progressPercent}
                    className="mt-3"
                  />
                  <p className="mt-2 text-[11px] text-mist-500">
                    {course.progress.completedLessons}/{course.progress.lessonCount}{" "}
                    lessons · {course.progress.passedAssessments}/
                    {course.progress.assessmentCount} assessments ·{" "}
                    {course.progress.submittedAssignments}/
                    {course.progress.assignmentCount} assignments
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-mist-500">
                This student is not enrolled in any courses yet.
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}
