import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Eye,
  EyeOff,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card, CardContent } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button, { buttonClasses } from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/staff/ConfirmDialog.jsx";
import CourseFormModal from "../../components/staff/CourseFormModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import {
  deleteManagedCourseRequest,
  getManagedCoursesRequest,
  setManagedCoursePublishedRequest,
} from "../../services/manage.js";

function formatDuration(minutes) {
  const value = Number(minutes) || 0;
  if (!value) return "No duration";
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

function Stat({ icon: Icon, label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-mist-400">
      <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
      {value} {label}
    </span>
  );
}

export default function StaffCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user.role === "admin";

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [published, setPublished] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [busyCourseId, setBusyCourseId] = useState(null);

  const loadCourses = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      const response = await getManagedCoursesRequest({
        search,
        isPublished: published === "" ? undefined : published,
      });
      setCourses(response.data.courses);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message || "Could not load courses.");
      setStatus("error");
    }
  }, [search, published]);

  useEffect(() => {
    const timer = setTimeout(loadCourses, 250);
    return () => clearTimeout(timer);
  }, [loadCourses]);

  function openCreate() {
    setEditingCourse(null);
    setFormOpen(true);
  }

  function openEdit(course) {
    setEditingCourse(course);
    setFormOpen(true);
  }

  async function togglePublish(course) {
    setBusyCourseId(course.id);

    try {
      const response = await setManagedCoursePublishedRequest(
        course.id,
        !course.isPublished
      );
      setCourses((current) =>
        current.map((item) =>
          item.id === course.id ? { ...item, ...response.data.course } : item
        )
      );
      toast({
        tone: "success",
        title: course.isPublished ? "Course unpublished" : "Course published",
        description: course.title,
      });
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not change publication",
        description: requestError.message,
      });
    } finally {
      setBusyCourseId(null);
    }
  }

  async function confirmDelete() {
    if (!deletingCourse) return;
    setDeleteLoading(true);

    try {
      await deleteManagedCourseRequest(deletingCourse.id);
      toast({
        tone: "success",
        title: "Course deleted",
        description: deletingCourse.title,
      });
      setDeletingCourse(null);
      await loadCourses();
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not delete course",
        description: requestError.message,
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <DashboardLayout
      title="Courses"
      subtitle="Author and publish learning content"
      navItems={getNavigation(user.role)}
    >
      <PageHeader
        eyebrow="Staff workspace"
        title="Courses"
        description="Create courses, manage their weekly content and publish when students are ready to see them."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            New course
          </Button>
        }
      />

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <Input
            label="Search"
            icon={Search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or slug"
            className="sm:max-w-sm"
          />

          <Select
            label="Publication"
            value={published}
            onChange={(event) => setPublished(event.target.value)}
            options={[
              { value: "", label: "All courses" },
              { value: "true", label: "Published only" },
              { value: "false", label: "Drafts only" },
            ]}
            className="sm:max-w-[200px]"
          />

          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={loadCourses}
            className="sm:ml-auto"
          >
            Refresh
          </Button>
        </CardContent>
      </Card>

      {status === "loading" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-xl" />
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
            onClick={loadCourses}
            className="mt-3 font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : courses.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={course.isPublished ? "success" : "warning"} dot>
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <Badge tone="neutral">{course.level}</Badge>
                  <Badge tone="info">{course.category}</Badge>
                </div>

                <h2 className="mt-3 font-display text-lg font-semibold text-white">
                  {course.title}
                </h2>
                <p className="mt-1 text-xs text-mist-500">
                  /{course.slug} · {formatDuration(course.durationMinutes)}
                </p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-mist-400">
                  {course.description || "No description yet."}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink-800 pt-3">
                  <Stat
                    icon={Layers}
                    label="modules"
                    value={Number(course.moduleCount) || 0}
                  />
                  <Stat
                    icon={BookOpen}
                    label="lessons"
                    value={Number(course.lessonCount) || 0}
                  />
                  <Stat
                    icon={Users}
                    label="students"
                    value={Number(course.enrollmentCount) || 0}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/staff/courses/${course.id}`}
                    className={buttonClasses({ variant: "primary", size: "sm" })}
                  >
                    Open course
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Pencil}
                    onClick={() => openEdit(course)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={course.isPublished ? EyeOff : Eye}
                    loading={busyCourseId === course.id}
                    onClick={() => togglePublish(course)}
                  >
                    {course.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  {isAdmin ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => setDeletingCourse(course)}
                      className="text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={search || published ? "No matching courses" : "No courses yet"}
          description={
            search || published
              ? "Try a different search term or publication filter."
              : "Create your first course, then add weekly modules and lessons."
          }
          action={
            <Button icon={Plus} onClick={openCreate}>
              New course
            </Button>
          }
        />
      )}

      <CourseFormModal
        open={formOpen}
        course={editingCourse}
        onClose={() => setFormOpen(false)}
        onSaved={loadCourses}
      />

      <ConfirmDialog
        open={Boolean(deletingCourse)}
        title="Delete this course?"
        description={deletingCourse?.title}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onClose={() => setDeletingCourse(null)}
      />
    </DashboardLayout>
  );
}
