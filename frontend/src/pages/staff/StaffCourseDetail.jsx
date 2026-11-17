import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Eye,
  EyeOff,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
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
import ConfirmDialog from "../../components/staff/ConfirmDialog.jsx";
import CourseFormModal from "../../components/staff/CourseFormModal.jsx";
import ModuleFormModal from "../../components/staff/ModuleFormModal.jsx";
import LessonFormModal from "../../components/staff/LessonFormModal.jsx";
import AssessmentFormModal from "../../components/staff/AssessmentFormModal.jsx";
import AssignmentFormModal from "../../components/staff/AssignmentFormModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import { formatDate } from "../../utils/roles.js";
import {
  deleteAssignmentRequest,
  deleteAssessmentRequest,
  deleteLessonRequest,
  deleteManagedCourseRequest,
  deleteModuleRequest,
  enrollStudentRequest,
  getCourseEnrollmentsRequest,
  getCourseRosterProgressRequest,
  getManagedCourseRequest,
  getStudentCourseProgressRequest,
  getStudentDirectoryRequest,
  removeEnrollmentRequest,
  setAssignmentPublishedRequest,
  setAssessmentPublishedRequest,
  setManagedCoursePublishedRequest,
} from "../../services/manage.js";

function formatDuration(minutes) {
  const value = Number(minutes) || 0;
  if (!value) return "—";
  return `${value} min`;
}

function tabClasses(active) {
  return active
    ? "border-brand-500 bg-brand-500/10 text-white"
    : "border-transparent text-mist-400 hover:border-ink-700 hover:text-white";
}

function Row({ icon: Icon, children, actions }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-ink-800 bg-ink-950/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-2.5">
        <Icon
          size={15}
          strokeWidth={1.8}
          className="mt-0.5 shrink-0 text-mist-500"
          aria-hidden="true"
        />
        <div className="min-w-0">{children}</div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-1.5">{actions}</div>
      ) : null}
    </div>
  );
}

function EmptySection({ children }) {
  return (
    <p className="rounded-lg border border-dashed border-ink-800 px-3 py-3 text-xs text-mist-500">
      {children}
    </p>
  );
}

export default function StaffCourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user.role === "admin";

  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("content");

  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [moduleModal, setModuleModal] = useState({ open: false, module: null });
  const [lessonModal, setLessonModal] = useState({
    open: false,
    moduleId: null,
    lesson: null,
  });
  const [assessmentModal, setAssessmentModal] = useState({
    open: false,
    moduleId: null,
    assessment: null,
  });
  const [assignmentModal, setAssignmentModal] = useState({
    open: false,
    moduleId: null,
    assignment: null,
  });
  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [busyKey, setBusyKey] = useState("");

  const [enrollments, setEnrollments] = useState([]);
  const [enrollStatus, setEnrollStatus] = useState("idle");
  const [studentSearch, setStudentSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [studentStatus, setStudentStatus] = useState("idle");
  const [enrollingId, setEnrollingId] = useState(null);

  const [roster, setRoster] = useState(null);
  const [rosterStatus, setRosterStatus] = useState("idle");
  const [studentProgress, setStudentProgress] = useState({
    open: false,
    loading: false,
    data: null,
    error: "",
  });

  const loadCourse = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setStatus("loading");
    setError("");

    try {
      const response = await getManagedCourseRequest(courseId);
      setCourse(response.data.course);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message || "Could not load the course.");
      setStatus("error");
    }
  }, [courseId]);

  // Reload after an edit without replacing the page with the loading skeleton.
  const refreshCourse = useCallback(() => loadCourse({ silent: true }), [
    loadCourse,
  ]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const loadEnrollments = useCallback(async () => {
    setEnrollStatus("loading");

    try {
      const response = await getCourseEnrollmentsRequest(courseId);
      setEnrollments(response.data.enrollments);
      setEnrollStatus("success");
    } catch (requestError) {
      setEnrollStatus("error");
      toast({
        tone: "danger",
        title: "Could not load enrolments",
        description: requestError.message,
      });
    }
  }, [courseId, toast]);

  const loadStudents = useCallback(async (search) => {
    setStudentStatus("loading");

    try {
      const response = await getStudentDirectoryRequest(search);
      setStudents(response.data.students);
      setStudentStatus("success");
    } catch (requestError) {
      setStudentStatus("error");
      toast({
        tone: "danger",
        title: "Could not load students",
        description: requestError.message,
      });
    }
  }, [toast]);

  const loadRoster = useCallback(async () => {
    setRosterStatus("loading");

    try {
      const response = await getCourseRosterProgressRequest(courseId);
      setRoster(response.data);
      setRosterStatus("success");
    } catch (requestError) {
      setRosterStatus("error");
      toast({
        tone: "danger",
        title: "Could not load progress",
        description: requestError.message,
      });
    }
  }, [courseId, toast]);

  useEffect(() => {
    if (tab === "enrolments") {
      loadEnrollments();
    }
    if (tab === "progress") {
      loadRoster();
    }
  }, [tab, loadEnrollments, loadRoster]);

  useEffect(() => {
    if (tab !== "enrolments") return;
    const timer = setTimeout(() => loadStudents(studentSearch), 250);
    return () => clearTimeout(timer);
  }, [tab, studentSearch, loadStudents]);

  const enrolledIds = useMemo(
    () => new Set(enrollments.map((item) => item.userId)),
    [enrollments]
  );

  const availableStudents = useMemo(
    () => students.filter((student) => !enrolledIds.has(student.id)),
    [students, enrolledIds]
  );

  async function runConfirmAction() {
    if (!confirm) return;
    setConfirmLoading(true);

    try {
      await confirm.action();
      setConfirm(null);
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Action failed",
        description: requestError.message,
      });
    } finally {
      setConfirmLoading(false);
    }
  }

  async function toggleCoursePublish() {
    setBusyKey("course-publish");

    try {
      const response = await setManagedCoursePublishedRequest(
        course.id,
        !course.isPublished
      );
      setCourse((current) => ({ ...current, ...response.data.course }));
      toast({
        tone: "success",
        title: course.isPublished ? "Course unpublished" : "Course published",
      });
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not change publication",
        description: requestError.message,
      });
    } finally {
      setBusyKey("");
    }
  }

  async function toggleAssessment(assessment) {
    setBusyKey(`assessment-${assessment.id}`);

    try {
      await setAssessmentPublishedRequest(assessment.id, !assessment.isPublished);
      toast({
        tone: "success",
        title: assessment.isPublished
          ? "Assessment unpublished"
          : "Assessment published",
      });
      await refreshCourse();
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not change assessment",
        description: requestError.message,
      });
    } finally {
      setBusyKey("");
    }
  }

  async function toggleAssignment(assignment) {
    setBusyKey(`assignment-${assignment.id}`);

    try {
      await setAssignmentPublishedRequest(assignment.id, !assignment.isPublished);
      toast({
        tone: "success",
        title: assignment.isPublished
          ? "Assignment unpublished"
          : "Assignment published",
      });
      await refreshCourse();
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not change assignment",
        description: requestError.message,
      });
    } finally {
      setBusyKey("");
    }
  }

  function askDeleteCourse() {
    setConfirm({
      title: "Delete this course?",
      description: course.title,
      confirmLabel: "Delete course",
      action: async () => {
        await deleteManagedCourseRequest(course.id);
        toast({ tone: "success", title: "Course deleted" });
        navigate("/staff/courses");
      },
    });
  }

  function askDeleteModule(module) {
    setConfirm({
      title: "Delete this module?",
      description: `Week ${module.weekNumber} — ${module.title}`,
      confirmLabel: "Delete module",
      action: async () => {
        await deleteModuleRequest(module.id);
        toast({ tone: "success", title: "Module deleted" });
        await refreshCourse();
      },
    });
  }

  function askDeleteLesson(lesson) {
    setConfirm({
      title: "Delete this lesson?",
      description: lesson.title,
      confirmLabel: "Delete lesson",
      action: async () => {
        await deleteLessonRequest(lesson.id);
        toast({ tone: "success", title: "Lesson deleted" });
        await refreshCourse();
      },
    });
  }

  function askDeleteAssessment(assessment) {
    setConfirm({
      title: "Delete this assessment?",
      description: assessment.title,
      confirmLabel: "Delete assessment",
      action: async () => {
        await deleteAssessmentRequest(assessment.id);
        toast({ tone: "success", title: "Assessment deleted" });
        await refreshCourse();
      },
    });
  }

  function askDeleteAssignment(assignment) {
    setConfirm({
      title: "Delete this assignment?",
      description: assignment.title,
      confirmLabel: "Delete assignment",
      action: async () => {
        await deleteAssignmentRequest(assignment.id);
        toast({ tone: "success", title: "Assignment deleted" });
        await refreshCourse();
      },
    });
  }

  async function enrollStudent(student) {
    setEnrollingId(student.id);

    try {
      await enrollStudentRequest(courseId, { userId: student.id });
      toast({
        tone: "success",
        title: "Student enrolled",
        description: student.fullName,
      });
      await Promise.all([loadEnrollments(), loadStudents(studentSearch)]);
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not enrol student",
        description: requestError.message,
      });
    } finally {
      setEnrollingId(null);
    }
  }

  function askRemoveEnrollment(enrollment) {
    setConfirm({
      title: "Remove this student?",
      description: `${enrollment.fullName} will lose access to ${course.title}.`,
      confirmLabel: "Remove student",
      action: async () => {
        await removeEnrollmentRequest(courseId, enrollment.userId);
        toast({ tone: "success", title: "Student removed" });
        await Promise.all([loadEnrollments(), loadStudents(studentSearch)]);
      },
    });
  }

  async function openStudentProgress(student) {
    setStudentProgress({
      open: true,
      loading: true,
      data: null,
      error: "",
    });

    try {
      const response = await getStudentCourseProgressRequest(
        courseId,
        student.userId
      );
      setStudentProgress({
        open: true,
        loading: false,
        data: response.data,
        error: "",
      });
    } catch (requestError) {
      setStudentProgress({
        open: true,
        loading: false,
        data: null,
        error: requestError.message,
      });
    }
  }

  if (status === "loading") {
    return (
      <DashboardLayout
        title="Course"
        subtitle="Loading course content"
        navItems={getNavigation(user.role)}
      >
        <Skeleton className="h-24 rounded-xl" />
        <div className="mt-5 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (status === "error" || !course) {
    return (
      <DashboardLayout
        title="Course"
        subtitle="Course unavailable"
        navItems={getNavigation(user.role)}
      >
        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-200"
        >
          <p>{error || "This course could not be found."}</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => loadCourse()}
              className="font-semibold underline underline-offset-4"
            >
              Try again
            </button>
            <Link to="/staff/courses" className="underline underline-offset-4">
              Back to courses
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const nextWeek = course.modules.length
    ? Math.max(...course.modules.map((module) => module.weekNumber)) + 1
    : 1;

  return (
    <DashboardLayout
      title={course.title}
      subtitle="Course editor"
      navItems={getNavigation(user.role)}
    >
      <Link
        to="/staff/courses"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-mist-400 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to courses
      </Link>

      <PageHeader
        eyebrow={course.isPublished ? "Published course" : "Draft course"}
        title={course.title}
        description={course.description || "No description yet."}
        actions={
          <>
            <Button
              variant="secondary"
              icon={Pencil}
              onClick={() => setCourseFormOpen(true)}
            >
              Edit course
            </Button>
            <Button
              variant={course.isPublished ? "secondary" : "primary"}
              icon={course.isPublished ? EyeOff : Eye}
              loading={busyKey === "course-publish"}
              onClick={toggleCoursePublish}
            >
              {course.isPublished ? "Unpublish" : "Publish"}
            </Button>
            {isAdmin ? (
              <Button variant="ghost" icon={Trash2} onClick={askDeleteCourse}>
                Delete
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2 border-b border-ink-800 pb-2">
        {[
          ["content", "Content"],
          ["enrolments", "Enrolments"],
          ["progress", "Progress"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${tabClasses(
              tab === value
            )}`}
          >
            {label}
            {value === "enrolments"
              ? ` (${Number(course.enrollmentCount) || 0})`
              : ""}
          </button>
        ))}
      </div>

      {tab === "content" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-medium text-white">
                Weekly modules
              </h2>
              <p className="mt-1 text-xs text-mist-500">
                {course.modules.length}{" "}
                {course.modules.length === 1 ? "module" : "modules"} ·{" "}
                {Number(course.lessonCount) || 0} lessons
              </p>
            </div>
            <Button
              icon={Plus}
              size="sm"
              onClick={() => setModuleModal({ open: true, module: null })}
            >
              Add module
            </Button>
          </div>

          {course.modules.length ? (
            course.modules.map((module) => (
              <Card key={module.id}>
                <CardHeader
                  title={`Week ${module.weekNumber} — ${module.title}`}
                  description={module.description}
                  action={
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Pencil}
                        onClick={() =>
                          setModuleModal({ open: true, module })
                        }
                      >
                        Edit
                      </Button>
                      {isAdmin ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => askDeleteModule(module)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  }
                />
                <CardContent className="space-y-5">
                  <section>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-mist-500">
                        Lessons ({module.lessons.length})
                      </h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Plus}
                        onClick={() =>
                          setLessonModal({
                            open: true,
                            moduleId: module.id,
                            lesson: null,
                          })
                        }
                      >
                        Lesson
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {module.lessons.length ? (
                        module.lessons.map((lesson) => (
                          <Row
                            key={lesson.id}
                            icon={BookOpen}
                            actions={
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={Pencil}
                                  onClick={() =>
                                    setLessonModal({
                                      open: true,
                                      moduleId: module.id,
                                      lesson,
                                    })
                                  }
                                >
                                  Edit
                                </Button>
                                {isAdmin ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={() => askDeleteLesson(lesson)}
                                  >
                                    Delete
                                  </Button>
                                ) : null}
                              </>
                            }
                          >
                            <p className="text-sm text-mist-100">
                              {lesson.title}
                            </p>
                            <p className="text-[11px] text-mist-500">
                              {formatDuration(lesson.durationMinutes)} ·{" "}
                              {lesson.videoProvider
                                ? `${lesson.videoProvider} video`
                                : "No video"}
                            </p>
                          </Row>
                        ))
                      ) : (
                        <EmptySection>
                          No lessons yet. Add one to start this week.
                        </EmptySection>
                      )}
                    </div>
                  </section>

                  <section>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-mist-500">
                        Assessments ({module.assessments.length})
                      </h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Plus}
                        onClick={() =>
                          setAssessmentModal({
                            open: true,
                            moduleId: module.id,
                            assessment: null,
                          })
                        }
                      >
                        Assessment
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {module.assessments.length ? (
                        module.assessments.map((assessment) => (
                          <Row
                            key={assessment.id}
                            icon={ClipboardCheck}
                            actions={
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    navigate(`/staff/assessments/${assessment.id}`)
                                  }
                                >
                                  Questions
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={assessment.isPublished ? EyeOff : Eye}
                                  loading={
                                    busyKey === `assessment-${assessment.id}`
                                  }
                                  onClick={() => toggleAssessment(assessment)}
                                >
                                  {assessment.isPublished ? "Unpublish" : "Publish"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={Pencil}
                                  onClick={() =>
                                    setAssessmentModal({
                                      open: true,
                                      moduleId: module.id,
                                      assessment,
                                    })
                                  }
                                >
                                  Edit
                                </Button>
                                {isAdmin ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={() => askDeleteAssessment(assessment)}
                                  >
                                    Delete
                                  </Button>
                                ) : null}
                              </>
                            }
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm text-mist-100">
                                {assessment.title}
                              </p>
                              <Badge
                                tone={assessment.isPublished ? "success" : "warning"}
                              >
                                {assessment.isPublished ? "Published" : "Draft"}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-mist-500">
                              {Number(assessment.questionCount) || 0} questions ·{" "}
                              {Number(assessment.attemptCount) || 0} attempts · pass{" "}
                              {assessment.passingScore}%
                            </p>
                          </Row>
                        ))
                      ) : (
                        <EmptySection>No assessments in this module.</EmptySection>
                      )}
                    </div>
                  </section>

                  <section>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-mist-500">
                        Assignments ({module.assignments.length})
                      </h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Plus}
                        onClick={() =>
                          setAssignmentModal({
                            open: true,
                            moduleId: module.id,
                            assignment: null,
                          })
                        }
                      >
                        Assignment
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {module.assignments.length ? (
                        module.assignments.map((assignment) => (
                          <Row
                            key={assignment.id}
                            icon={ClipboardList}
                            actions={
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    navigate(`/staff/assignments/${assignment.id}`)
                                  }
                                >
                                  Submissions
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={assignment.isPublished ? EyeOff : Eye}
                                  loading={
                                    busyKey === `assignment-${assignment.id}`
                                  }
                                  onClick={() => toggleAssignment(assignment)}
                                >
                                  {assignment.isPublished ? "Unpublish" : "Publish"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={Pencil}
                                  onClick={() =>
                                    setAssignmentModal({
                                      open: true,
                                      moduleId: module.id,
                                      assignment,
                                    })
                                  }
                                >
                                  Edit
                                </Button>
                                {isAdmin ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={() => askDeleteAssignment(assignment)}
                                  >
                                    Delete
                                  </Button>
                                ) : null}
                              </>
                            }
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm text-mist-100">
                                {assignment.title}
                              </p>
                              <Badge
                                tone={assignment.isPublished ? "success" : "warning"}
                              >
                                {assignment.isPublished ? "Published" : "Draft"}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-mist-500">
                              {Number(assignment.submissionCount) || 0} submissions ·{" "}
                              {Number(assignment.gradedCount) || 0} graded ·{" "}
                              {assignment.maxPoints} points
                              {assignment.dueAt
                                ? ` · due ${formatDate(assignment.dueAt)}`
                                : ""}
                            </p>
                          </Row>
                        ))
                      ) : (
                        <EmptySection>No assignments in this module.</EmptySection>
                      )}
                    </div>
                  </section>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={Layers}
              title="This course has no modules yet"
              description="Add the first weekly module, then create lessons, assessments and assignments inside it."
              action={
                <Button
                  icon={Plus}
                  onClick={() => setModuleModal({ open: true, module: null })}
                >
                  Add module
                </Button>
              }
            />
          )}
        </div>
      ) : null}

      {tab === "enrolments" ? (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader
                title={`Enrolled students (${enrollments.length})`}
                description="Students who can open this course and its lessons."
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={RefreshCw}
                    onClick={loadEnrollments}
                  >
                    Refresh
                  </Button>
                }
              />
              <CardContent className="space-y-2">
                {enrollStatus === "loading" ? (
                  <Skeleton className="h-24 rounded-lg" />
                ) : enrollStatus === "error" ? (
                  <EmptySection>Could not load enrolments.</EmptySection>
                ) : enrollments.length ? (
                  enrollments.map((enrollment) => (
                    <Row
                      key={enrollment.userId}
                      icon={Users}
                      actions={
                        isAdmin ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={UserMinus}
                            onClick={() => askRemoveEnrollment(enrollment)}
                          >
                            Remove
                          </Button>
                        ) : null
                      }
                    >
                      <p className="text-sm text-mist-100">
                        {enrollment.fullName}
                      </p>
                      <p className="text-[11px] text-mist-500">
                        {enrollment.email} · enrolled{" "}
                        {formatDate(enrollment.enrolledAt)}
                      </p>
                    </Row>
                  ))
                ) : (
                  <EmptySection>
                    No students are enrolled in this course yet.
                  </EmptySection>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Add a student"
                description={
                  isAdmin
                    ? "Search the student directory by name or email."
                    : "Only administrators can change enrolments."
                }
              />
              <CardContent className="space-y-3">
                {isAdmin ? (
                  <>
                    <Input
                      icon={Search}
                      value={studentSearch}
                      onChange={(event) => setStudentSearch(event.target.value)}
                      placeholder="Search students"
                      aria-label="Search students"
                    />

                    {studentStatus === "loading" ? (
                      <Skeleton className="h-20 rounded-lg" />
                    ) : availableStudents.length ? (
                      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                        {availableStudents.slice(0, 12).map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-ink-800 bg-ink-950/30 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm text-mist-100">
                                {student.fullName}
                              </p>
                              <p className="truncate text-[11px] text-mist-500">
                                {student.email}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              icon={UserPlus}
                              loading={enrollingId === student.id}
                              onClick={() => enrollStudent(student)}
                            >
                              Enrol
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptySection>
                        {studentSearch
                          ? "No matching students left to enrol."
                          : "Every active student is already enrolled."}
                      </EmptySection>
                    )}
                  </>
                ) : (
                  <EmptySection>
                    Ask an administrator to add or remove students.
                  </EmptySection>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "progress" ? (
        <div className="space-y-5">
          {rosterStatus === "loading" ? (
            <Skeleton className="h-52 rounded-xl" />
          ) : rosterStatus === "error" ? (
            <EmptySection>Could not load course progress.</EmptySection>
          ) : roster ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-5">
                  <p className="text-xs text-mist-400">Enrolled</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-white">
                    {roster.summary.enrolled}
                  </p>
                </div>
                <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-5">
                  <p className="text-xs text-mist-400">Completed</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-white">
                    {roster.summary.completed}
                  </p>
                </div>
                <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-5">
                  <p className="text-xs text-mist-400">Average progress</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-white">
                    {roster.summary.averageProgress}%
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader
                  title="Student progress"
                  description="Derived from real lesson completions, passed assessments and submitted assignments."
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={RefreshCw}
                      onClick={loadRoster}
                    >
                      Refresh
                    </Button>
                  }
                />
                <CardContent className="space-y-3">
                  {roster.students.length ? (
                    roster.students.map((student) => (
                      <div
                        key={student.userId}
                        className="rounded-lg border border-ink-800 bg-ink-950/30 px-3 py-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm text-mist-100">
                              {student.fullName}
                            </p>
                            <p className="truncate text-[11px] text-mist-500">
                              {student.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              tone={
                                student.progress.isComplete ? "success" : "neutral"
                              }
                            >
                              {student.progress.isComplete
                                ? "Complete"
                                : `${student.progress.completedUnits}/${student.progress.totalUnits} units`}
                            </Badge>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openStudentProgress(student)}
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                        <ProgressBar
                          value={student.progress.progressPercent}
                          className="mt-3"
                        />
                      </div>
                    ))
                  ) : (
                    <EmptySection>
                      No enrolled students to show progress for.
                    </EmptySection>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      ) : null}

      <CourseFormModal
        open={courseFormOpen}
        course={course}
        onClose={() => setCourseFormOpen(false)}
        onSaved={refreshCourse}
      />

      <ModuleFormModal
        open={moduleModal.open}
        courseId={course.id}
        module={moduleModal.module}
        nextWeek={nextWeek}
        onClose={() => setModuleModal({ open: false, module: null })}
        onSaved={refreshCourse}
      />

      <LessonFormModal
        open={lessonModal.open}
        moduleId={lessonModal.moduleId}
        lesson={lessonModal.lesson}
        onClose={() =>
          setLessonModal({ open: false, moduleId: null, lesson: null })
        }
        onSaved={refreshCourse}
      />

      <AssessmentFormModal
        open={assessmentModal.open}
        moduleId={assessmentModal.moduleId}
        assessment={assessmentModal.assessment}
        onClose={() =>
          setAssessmentModal({
            open: false,
            moduleId: null,
            assessment: null,
          })
        }
        onSaved={refreshCourse}
      />

      <AssignmentFormModal
        open={assignmentModal.open}
        moduleId={assignmentModal.moduleId}
        assignment={assignmentModal.assignment}
        onClose={() =>
          setAssignmentModal({
            open: false,
            moduleId: null,
            assignment: null,
          })
        }
        onSaved={refreshCourse}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        loading={confirmLoading}
        onConfirm={runConfirmAction}
        onClose={() => setConfirm(null)}
      />

      <Modal
        open={studentProgress.open}
        onClose={() =>
          setStudentProgress({ open: false, loading: false, data: null, error: "" })
        }
        title="Student progress"
        description={
          studentProgress.data?.student
            ? `${studentProgress.data.student.fullName} · ${studentProgress.data.student.email}`
            : "Detailed course progress"
        }
        size="lg"
      >
        {studentProgress.loading ? (
          <Skeleton className="h-40 rounded-lg" />
        ) : studentProgress.error ? (
          <p className="text-sm text-rose-300">{studentProgress.error}</p>
        ) : studentProgress.data ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-ink-800 bg-ink-950/30 p-4">
              <ProgressBar
                value={studentProgress.data.progress.progressPercent}
                label="Overall progress"
              />
              <p className="mt-3 text-xs text-mist-500">
                {studentProgress.data.progress.completedUnits} of{" "}
                {studentProgress.data.progress.totalUnits} learning units
                complete
                {studentProgress.data.progress.nextAction
                  ? ` · Next: ${studentProgress.data.progress.nextAction.title}`
                  : ""}
              </p>
            </div>

            <div className="space-y-3">
              {studentProgress.data.modules.map((module) => (
                <div key={module.id}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                    <span className="text-mist-200">
                      Week {module.weekNumber} — {module.title}
                    </span>
                    <Badge tone={module.isCompleted ? "success" : "neutral"}>
                      {module.isCompleted ? "Complete" : `${module.progressPercent}%`}
                    </Badge>
                  </div>
                  <ProgressBar
                    value={module.progressPercent}
                    size="sm"
                    showValue={false}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}
