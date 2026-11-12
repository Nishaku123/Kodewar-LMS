import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock3,
  ClipboardCheck,
  ClipboardList,
  Lock,
  Play,
  Signal,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button, { buttonClasses } from "../../components/ui/Button.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ProgressBar from "../../components/ui/ProgressBar.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { Card, CardContent } from "../../components/ui/Card.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import { getCourseRequest } from "../../services/courses.js";
import {
  completeLessonRequest,
  uncompleteLessonRequest,
} from "../../services/progress.js";

function getVideoSource(provider, videoUrl) {
  if (!provider || !videoUrl) return null;

  try {
    const url = new URL(videoUrl);
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      return null;
    }

    if (provider === "direct") {
      return { type: "video", src: url.href };
    }

    if (provider === "youtube") {
      const host = url.hostname.toLowerCase();
      const supportedHosts = [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtube-nocookie.com",
        "www.youtube-nocookie.com",
        "youtu.be",
      ];

      if (!supportedHosts.includes(host)) return null;

      const videoId =
        host === "youtu.be"
          ? url.pathname.split("/").filter(Boolean)[0]
          : url.searchParams.get("v") ||
            url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];

      if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null;
      return {
        type: "embed",
        src: `https://www.youtube-nocookie.com/embed/${videoId}`,
      };
    }

    if (provider === "vimeo") {
      const host = url.hostname.toLowerCase();
      if (host !== "vimeo.com" && host !== "www.vimeo.com" && host !== "player.vimeo.com") {
        return null;
      }

      const videoId = url.pathname.match(/(?:^|\/)(?:video\/)?(\d+)(?:\/|$)/)?.[1];
      if (!videoId) return null;
      return { type: "embed", src: `https://player.vimeo.com/video/${videoId}` };
    }
  } catch {
    return null;
  }

  return null;
}

function LessonPlayer({ lesson }) {
  const [playbackError, setPlaybackError] = useState(false);
  const video = getVideoSource(lesson?.videoProvider, lesson?.videoUrl);

  useEffect(() => {
    setPlaybackError(false);
  }, [lesson?.id]);

  if (!lesson) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-ink-700 bg-ink-950/60 p-6 text-center text-sm text-mist-500">
        Select a lesson to view its content.
      </div>
    );
  }

  if (!lesson.isUnlocked) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-700 bg-ink-950/60 p-6 text-center text-sm text-mist-500">
        <Lock size={22} aria-hidden="true" />
        This lesson unlocks after the previous week is complete.
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-ink-700 bg-ink-950/60 p-6 text-center text-sm text-mist-500">
        {lesson.videoUrl
          ? "This lesson's video URL is not valid for the selected provider."
          : "A video has not been added to this lesson yet."}
      </div>
    );
  }

  if (playbackError) {
    return (
      <div
        role="alert"
        className="flex aspect-video items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/5 p-6 text-center text-sm text-rose-200"
      >
        This video could not be played. Try again later.
      </div>
    );
  }

  return (
    <div className="aspect-video overflow-hidden rounded-xl border border-ink-700 bg-black">
      {video.type === "embed" ? (
        <iframe
          title={lesson.title}
          src={video.src}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          onError={() => setPlaybackError(true)}
        />
      ) : (
        <video
          className="h-full w-full"
          src={video.src}
          controls
          preload="metadata"
          onError={() => setPlaybackError(true)}
        >
          Your browser does not support video playback.
        </video>
      )}
    </div>
  );
}

function formatDuration(minutes) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

export default function StudentCourseDetail() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingLesson, setSavingLesson] = useState(false);

  const loadCourse = useCallback(
    async ({ keepSelection = false } = {}) => {
      setLoading(true);
      setError("");

      try {
        const response = await getCourseRequest(courseId);
        const loaded = response.data.course;
        setCourse(loaded);

        const allLessons = loaded.modules.flatMap((module) => module.lessons);
        setSelectedLessonId((current) => {
          const stillExists =
            keepSelection &&
            allLessons.some((lesson) => lesson.id === current);
          if (stillExists) return current;

          const next = allLessons.find(
            (lesson) => lesson.isUnlocked && !lesson.isCompleted
          );
          return next?.id ?? allLessons[0]?.id ?? null;
        });
      } catch (requestError) {
        setError(requestError.message || "Could not load this course.");
      } finally {
        setLoading(false);
      }
    },
    [courseId]
  );

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const selectedLesson = course?.modules
    .flatMap((module) => module.lessons)
    .find((lesson) => lesson.id === selectedLessonId);
  const progress = course?.progress;

  async function handleToggleLesson(lesson) {
    if (!lesson || savingLesson) return;

    setSavingLesson(true);

    try {
      if (lesson.isCompleted) {
        await uncompleteLessonRequest(lesson.id);
        toast({
          tone: "info",
          title: "Lesson marked as not complete",
          description: "Later weeks may lock again until this lesson is done.",
        });
      } else {
        await completeLessonRequest(lesson.id);
        toast({
          tone: "success",
          title: "Lesson complete",
          description: "Your course progress has been updated.",
        });
      }

      await loadCourse({ keepSelection: true });
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not update the lesson",
        description: requestError.message || "Please try again.",
      });
    } finally {
      setSavingLesson(false);
    }
  }

  return (
    <DashboardLayout
      title={course?.title || "Course"}
      subtitle="Your Kodewar learning workspace"
      navItems={getNavigation(user.role)}
    >
      <div className="mb-5">
        <Link
          to="/student/courses"
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to my courses
        </Link>
      </div>

      {loading ? (
        <div className="space-y-5">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="aspect-video rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-200"
        >
          {error}
        </div>
      ) : course ? (
        <>
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt=""
              className="mb-5 h-44 w-full rounded-xl border border-ink-700 object-cover sm:h-56"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : null}

          <PageHeader
            eyebrow="Course"
            title={course.title}
            description={course.description}
            actions={
              <Badge tone={progress?.isComplete ? "success" : "brand"} dot>
                {progress?.isComplete ? "Course complete" : "Enrolled"}
              </Badge>
            }
          />

          <div className="mb-3 flex flex-wrap gap-3 text-xs text-mist-400">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={14} aria-hidden="true" />
              {course.modules.length}{" "}
              {course.modules.length === 1 ? "week" : "weeks"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Signal size={14} aria-hidden="true" />
              {course.level}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={14} aria-hidden="true" />
              {formatDuration(course.durationMinutes) || "Flexible schedule"}
            </span>
            {progress ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} aria-hidden="true" />
                {progress.completedLessons} of {progress.lessonCount} lessons
                complete
              </span>
            ) : null}
          </div>

          {progress ? (
            <ProgressBar
              value={progress.progressPercent}
              label="Course progress"
              className="mb-6"
            />
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
            <section aria-label="Lesson player" className="space-y-4">
              <LessonPlayer lesson={selectedLesson} />
              <Card>
                <CardContent>
                  {selectedLesson ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-display text-lg font-medium text-white">
                          {selectedLesson.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedLesson.isCompleted ? (
                            <Badge tone="success" dot>
                              Completed
                            </Badge>
                          ) : null}
                          {formatDuration(selectedLesson.durationMinutes) ? (
                            <Badge tone="neutral">
                              {formatDuration(selectedLesson.durationMinutes)}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      {selectedLesson.description ? (
                        <p className="mt-2 text-sm leading-6 text-mist-400">
                          {selectedLesson.description}
                        </p>
                      ) : null}

                      {selectedLesson.isUnlocked ? (
                        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink-800 pt-4">
                          <Button
                            variant={selectedLesson.isCompleted ? "secondary" : "primary"}
                            size="sm"
                            loading={savingLesson}
                            icon={
                              selectedLesson.isCompleted ? Circle : CheckCircle2
                            }
                            onClick={() => handleToggleLesson(selectedLesson)}
                          >
                            {selectedLesson.isCompleted
                              ? "Mark as not complete"
                              : "Mark lesson complete"}
                          </Button>
                          <span className="text-xs text-mist-500">
                            Complete every lesson in a week to unlock its
                            assessment and the next week.
                          </span>
                        </div>
                      ) : (
                        <p className="mt-4 inline-flex items-center gap-1.5 border-t border-ink-800 pt-3 text-xs text-mist-500">
                          <Lock size={13} aria-hidden="true" />
                          This lesson is locked until the previous week is
                          complete.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-mist-400">
                      This course does not have any lessons yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

            <aside aria-label="Course structure" className="space-y-3">
              <div>
                <h2 className="font-display text-lg font-medium text-white">
                  Course structure
                </h2>
                <p className="mt-1 text-xs text-mist-500">
                  Weekly modules, assessments and assignments
                </p>
              </div>

              {course.modules.length ? (
                course.modules.map((module) => (
                  <Card
                    key={module.id}
                    className={module.isUnlocked ? undefined : "opacity-80"}
                  >
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-300">
                            Week {module.weekNumber}
                          </p>
                          <h3 className="mt-1 font-medium text-white">
                            {module.title}
                          </h3>
                          {module.description ? (
                            <p className="mt-1 text-xs leading-5 text-mist-500">
                              {module.description}
                            </p>
                          ) : null}
                        </div>
                        {module.isCompleted ? (
                          <Badge tone="success">Complete</Badge>
                        ) : !module.isUnlocked ? (
                          <Badge tone="neutral">
                            <Lock size={11} aria-hidden="true" />
                            Locked
                          </Badge>
                        ) : (
                          <Badge tone="brand">{module.progressPercent}%</Badge>
                        )}
                      </div>

                      {module.lessons.length ? (
                        <ul className="space-y-1">
                          {module.lessons.map((lesson) => {
                            const selected = lesson.id === selectedLessonId;
                            const locked = !lesson.isUnlocked;

                            return (
                              <li key={lesson.id}>
                                <Button
                                  variant={selected ? "secondary" : "ghost"}
                                  size="sm"
                                  fullWidth
                                  className="justify-start"
                                  aria-pressed={selected}
                                  disabled={locked}
                                  onClick={() =>
                                    setSelectedLessonId(lesson.id)
                                  }
                                >
                                  {locked ? (
                                    <Lock size={13} aria-hidden="true" />
                                  ) : lesson.isCompleted ? (
                                    <CheckCircle2
                                      size={13}
                                      className="text-emerald-300"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <Play size={13} aria-hidden="true" />
                                  )}
                                  <span className="min-w-0 flex-1 truncate text-left">
                                    {lesson.title}
                                  </span>
                                  {formatDuration(lesson.durationMinutes) ? (
                                    <span className="shrink-0 text-[10px] text-mist-500">
                                      {formatDuration(lesson.durationMinutes)}
                                    </span>
                                  ) : null}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-xs text-mist-500">
                          Lessons will appear here when added.
                        </p>
                      )}

                      {module.assessments.length ? (
                        <div className="mt-4 border-t border-ink-800 pt-3">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                            Assessment
                          </p>
                          <ul className="space-y-1.5">
                            {module.assessments.map((assessment) => (
                              <li key={assessment.id}>
                                {assessment.isUnlocked ? (
                                  <Link
                                    to={`/student/assessments/${assessment.id}`}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-ink-800 px-3 py-2 text-xs text-mist-200 transition-colors hover:border-ink-600 hover:text-white"
                                  >
                                    <span className="inline-flex min-w-0 items-center gap-2">
                                      <ClipboardCheck
                                        size={14}
                                        className="shrink-0 text-brand-300"
                                        aria-hidden="true"
                                      />
                                      <span className="truncate">
                                        {assessment.title}
                                      </span>
                                    </span>
                                    <span className="shrink-0">
                                      {assessment.passed ? (
                                        <CheckCircle2
                                          size={14}
                                          className="text-emerald-300"
                                          aria-label="Passed"
                                        />
                                      ) : (
                                        <ArrowUpRight
                                          size={14}
                                          aria-hidden="true"
                                        />
                                      )}
                                    </span>
                                  </Link>
                                ) : (
                                  <span className="flex items-center gap-2 rounded-lg border border-ink-800 px-3 py-2 text-xs text-mist-500">
                                    <Lock size={13} aria-hidden="true" />
                                    <span className="truncate">
                                      {assessment.title}
                                    </span>
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {module.assignments.length ? (
                        <div className="mt-4 border-t border-ink-800 pt-3">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                            Assignment
                          </p>
                          <ul className="space-y-1.5">
                            {module.assignments.map((assignment) => (
                              <li key={assignment.id}>
                                {assignment.isUnlocked ? (
                                  <Link
                                    to={`/student/assignments/${assignment.id}`}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-ink-800 px-3 py-2 text-xs text-mist-200 transition-colors hover:border-ink-600 hover:text-white"
                                  >
                                    <span className="inline-flex min-w-0 items-center gap-2">
                                      <ClipboardList
                                        size={14}
                                        className="shrink-0 text-cyan-300"
                                        aria-hidden="true"
                                      />
                                      <span className="truncate">
                                        {assignment.title}
                                      </span>
                                    </span>
                                    <span className="shrink-0">
                                      {assignment.isCompleted ? (
                                        <CheckCircle2
                                          size={14}
                                          className="text-emerald-300"
                                          aria-label="Submitted"
                                        />
                                      ) : (
                                        <ArrowUpRight
                                          size={14}
                                          aria-hidden="true"
                                        />
                                      )}
                                    </span>
                                  </Link>
                                ) : (
                                  <span className="flex items-center gap-2 rounded-lg border border-ink-800 px-3 py-2 text-xs text-mist-500">
                                    <Lock size={13} aria-hidden="true" />
                                    <span className="truncate">
                                      {assignment.title}
                                    </span>
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="No modules yet"
                  description="Weekly modules will appear here when added to the course."
                  className="py-8"
                />
              )}
            </aside>
          </div>
        </>
      ) : null}
    </DashboardLayout>
  );
}
