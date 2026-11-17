import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import CourseCard from "../../components/course/CourseCard.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import {
  enrollInCourseRequest,
  getCourseCatalogueRequest,
  getMyCoursesRequest,
} from "../../services/courses.js";

function formatDuration(minutes) {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) return `${remainingMinutes} min`;
  return remainingMinutes
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
}

function CourseGrid({ courses, onOpen, onEnroll, enrollingCourseId }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={{
            ...course,
            duration: formatDuration(course.durationMinutes),
            progress: course.progressPercent ?? 0,
            status: course.isComplete
              ? "Completed"
              : course.progressPercent > 0
                ? "In progress"
                : "Not started",
          }}
          isEnrolled={Boolean(course.isEnrolled)}
          showProgress={Boolean(course.isEnrolled)}
          actionDisabled={enrollingCourseId === course.id}
          actionLoading={enrollingCourseId === course.id}
          onContinue={() => onOpen(course)}
          onEnroll={() => onEnroll(course)}
        />
      ))}
    </div>
  );
}

export default function StudentCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [catalogue, setCatalogue] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);

  const loadCourses = useCallback(async () => {
    setStatus("loading");
    setError("");

    try {
      const [catalogueResponse, myCoursesResponse] = await Promise.all([
        getCourseCatalogueRequest(),
        getMyCoursesRequest(),
      ]);
      setCatalogue(catalogueResponse.data.courses);
      setMyCourses(myCoursesResponse.data.courses);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message || "Could not load courses.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const availableCourses = useMemo(
    () => catalogue.filter((course) => !course.isEnrolled),
    [catalogue]
  );

  async function handleEnroll(course) {
    setEnrollingCourseId(course.id);

    try {
      await enrollInCourseRequest(course.id);
      toast({
        tone: "success",
        title: "You're enrolled",
        description: `${course.title} is now in your courses.`,
      });
      await loadCourses();
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not enrol",
        description: requestError.message || "Please try again.",
      });
    } finally {
      setEnrollingCourseId(null);
    }
  }

  return (
    <DashboardLayout
      title="My courses"
      subtitle="Your Kodewar learning workspace"
      navItems={getNavigation(user.role)}
    >
      <PageHeader
        eyebrow="Student workspace"
        title="Courses"
        description="Browse published courses, enrol, and explore each course's weekly modules and lessons."
      />

      {status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading courses">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-xl" />
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
            className="mt-3 font-semibold underline underline-offset-4"
            onClick={loadCourses}
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          <section aria-labelledby="enrolled-courses-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2
                  id="enrolled-courses-heading"
                  className="font-display text-lg font-medium text-white"
                >
                  My learning
                </h2>
                <p className="mt-1 text-xs text-mist-500">
                  {myCourses.length} enrolled{" "}
                  {myCourses.length === 1 ? "course" : "courses"}
                </p>
              </div>
            </div>

            {myCourses.length ? (
              <CourseGrid
                courses={myCourses.map((course) => ({
                  ...course,
                  isEnrolled: true,
                }))}
                onOpen={(course) =>
                  navigate(`/student/courses/${course.id}`)
                }
                onEnroll={handleEnroll}
                enrollingCourseId={enrollingCourseId}
              />
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="You haven't enrolled in a course yet"
                description="Choose a published course from the catalogue below to get started."
                className="py-8"
              />
            )}
          </section>

          <section aria-labelledby="course-catalogue-heading">
            <div className="mb-4">
              <h2
                id="course-catalogue-heading"
                className="font-display text-lg font-medium text-white"
              >
                Course catalogue
              </h2>
              <p className="mt-1 text-xs text-mist-500">
                Published courses available to students
              </p>
            </div>

            {availableCourses.length ? (
              <CourseGrid
                courses={availableCourses}
                onOpen={(course) => navigate(`/student/courses/${course.id}`)}
                onEnroll={handleEnroll}
                enrollingCourseId={enrollingCourseId}
              />
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No new courses available"
                description={
                  catalogue.length
                    ? "You're enrolled in every course currently in the catalogue."
                    : "There are no published courses yet. The catalogue will show courses once course content is added and published."
                }
                className="py-8"
              />
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
