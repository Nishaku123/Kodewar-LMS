import { BookOpen, Clock, PlayCircle, PlusCircle, Signal } from "lucide-react";
import { Card } from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";
import Button from "../ui/Button.jsx";

const statusTones = {
  "In progress": "brand",
  Completed: "success",
  "Not started": "neutral",
  Available: "neutral",
};

/**
 * Course card shared by the course catalogue and design-system preview.
 */
export default function CourseCard({
  course,
  onContinue,
  onEnroll,
  isEnrolled = true,
  showProgress = true,
  actionDisabled = false,
  actionLoading = false,
}) {
  const {
    title,
    description,
    category = "Course",
    level = "Beginner",
    lessonCount = 0,
    duration = "",
    thumbnailUrl = "",
    progress = 0,
    status = "Not started",
  } = course;

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-colors duration-200 hover:border-ink-600">
      <div className="relative flex h-36 items-end overflow-hidden bg-gradient-to-br from-brand-600/25 via-ink-800 to-cyan-500/10 p-4">
        {thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/30 to-ink-950/10"
              aria-hidden="true"
            />
          </>
        ) : (
          <div
            className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:28px_28px]"
            aria-hidden="true"
          />
        )}

        <div className="relative flex w-full items-center justify-between gap-2">
          <Badge tone="brand">{category}</Badge>
          <Badge
            tone={statusTones[isEnrolled ? status : "Available"] || "neutral"}
            dot
          >
            {isEnrolled ? status : "Available"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-medium text-white">
          {title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-mist-500">
          {description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-mist-500">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen size={13} aria-hidden="true" />
            {lessonCount} lessons
          </span>
          {duration ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} aria-hidden="true" />
              {duration}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Signal size={13} aria-hidden="true" />
            {level}
          </span>
        </div>

        {showProgress ? (
          <ProgressBar
            value={progress}
            label="Course progress"
            className="mt-5"
          />
        ) : null}

        <div className="mt-auto pt-5">
          <Button
            variant={isEnrolled ? "secondary" : "primary"}
            fullWidth
            loading={actionLoading}
            icon={isEnrolled ? PlayCircle : PlusCircle}
            disabled={actionDisabled}
            onClick={() =>
              isEnrolled ? onContinue?.(course) : onEnroll?.(course)
            }
          >
            {isEnrolled
              ? progress > 0
                ? "Continue learning"
                : "Open course"
              : "Enrol in course"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
