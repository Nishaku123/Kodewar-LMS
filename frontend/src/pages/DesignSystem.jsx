import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Clock,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Mail,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";

import DashboardLayout from "../layouts/DashboardLayout.jsx";
import Button, { buttonClasses } from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Textarea from "../components/ui/Textarea.jsx";
import Select from "../components/ui/Select.jsx";
import Checkbox from "../components/ui/Checkbox.jsx";
import Badge from "../components/ui/Badge.jsx";
import Alert from "../components/ui/Alert.jsx";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "../components/ui/Card.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import ProgressRing from "../components/ui/ProgressRing.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Modal from "../components/ui/Modal.jsx";
import Skeleton, { SkeletonText } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import CourseCard from "../components/course/CourseCard.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { cn } from "../utils/cn.js";

const previewNav = [
  { label: "Overview", to: "/", icon: LayoutDashboard, end: true },
  { label: "Design system", to: "/design", icon: Palette, end: true },
];

const sectionLinks = [
  { id: "foundations", label: "Foundations" },
  { id: "buttons", label: "Buttons" },
  { id: "forms", label: "Forms" },
  { id: "cards", label: "Cards" },
  { id: "progress", label: "Progress" },
  { id: "feedback", label: "Feedback" },
  { id: "overlays", label: "Overlays" },
  { id: "stats", label: "Stats" },
];

const colors = [
  { name: "Ink 950", hex: "#06070B" },
  { name: "Ink 900", hex: "#0A0C12" },
  { name: "Ink 800", hex: "#11151E" },
  { name: "Ink 700", hex: "#1C2230" },
  { name: "Mist 400", hex: "#8794AA" },
  { name: "Mist 500", hex: "#6B7790" },
  { name: "Brand 500", hex: "#8B5CF6" },
  { name: "Brand 400", hex: "#A78BFA" },
  { name: "Cyan 400", hex: "#22D3EE" },
  { name: "Success", hex: "#34D399" },
  { name: "Warning", hex: "#FBBF24" },
  { name: "Danger", hex: "#FB7185" },
];

const weekOptions = [
  { value: "week-1", label: "Week 01 – HTML fundamentals" },
  { value: "week-2", label: "Week 02 – CSS fundamentals" },
  { value: "week-3", label: "Week 03 – JavaScript basics" },
];

const sampleCourse = {
  title: "Full Stack Web Development",
  description:
    "Build responsive interfaces and production APIs with JavaScript, React and Express.",
  category: "Web Development",
  level: "Beginner",
  lessonCount: 24,
  duration: "8 weeks",
  progress: 42,
  status: "In progress",
};

function Section({ id, title, description, children, className }) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-32 border-t border-ink-800/70 py-10 first:border-t-0 first:pt-0",
        className
      )}
    >
      <div className="mb-6">
        <h2 className="font-display text-xl font-medium text-white">{title}</h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-mist-500">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ColorSwatch({ name, hex }) {
  return (
    <div className="rounded-lg border border-ink-700/70 bg-ink-900/60 p-2">
      <div
        className="h-10 rounded-md border border-white/5"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      <p className="mt-2 text-[11px] font-medium text-mist-200">{name}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-mist-500">
        {hex}
      </p>
    </div>
  );
}

export default function DesignSystem() {
  const { toast } = useToast();

  const [fullName, setFullName] = useState("Aarav Sharma");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("kodewar-demo");
  const [week, setWeek] = useState("week-2");
  const [notes, setNotes] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [progress, setProgress] = useState(42);
  const [modalOpen, setModalOpen] = useState(false);
  const [successAlertVisible, setSuccessAlertVisible] = useState(true);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError =
    emailTouched && !emailValid
      ? "Enter a valid email address, for example name@example.com."
      : undefined;

  function handleSave(event) {
    event.preventDefault();
    setEmailTouched(true);

    if (!emailValid) {
      toast({
        tone: "danger",
        title: "Check the email field",
        description:
          "This preview uses the same validation pattern as the real forms.",
      });
      return;
    }

    toast({
      tone: "success",
      title: "Preview form validated",
      description:
        "Nothing was saved. Real persistence will be connected to the backend.",
    });
  }

  function handleReset() {
    setFullName("");
    setEmail("");
    setEmailTouched(false);
    setPassword("");
    setWeek("week-1");
    setNotes("");
    setNotifications(false);
    toast({
      tone: "info",
      title: "Preview reset",
      description: "All demo fields were cleared.",
    });
  }

  function handleConfirm() {
    closeModal();
    toast({
      tone: "success",
      title: "Lesson marked complete",
      description: "In the student flow this calls the lesson progress API.",
    });
  }

  return (
    <DashboardLayout
      title="Design system"
      subtitle="Reusable components and layouts for every Kodewar panel"
      navItems={previewNav}
    >
      <div className="flex flex-col gap-5 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">
            <span className="h-px w-8 bg-brand-500" aria-hidden="true" />
            Phase 2 · Design system
          </p>

          <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            One visual language for every learner.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-mist-400">
            Tokens, components and layouts built to stay consistent as the
            student, trainer and admin panels grow.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/design/auth"
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            Auth layout
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
          <Link
            to="/"
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            Status page
          </Link>
        </div>
      </div>

      <nav
        aria-label="Design system sections"
        className="sticky top-16 z-20 -mx-4 mb-8 border-y border-ink-800/70 bg-ink-950/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        <ul className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sectionLinks.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-mist-400 transition-colors hover:bg-ink-800 hover:text-white"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section
        id="foundations"
        title="Foundations"
        description="Colour, type and surface tokens defined once in frontend/src/styles/index.css."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-sm font-medium text-white">Colour tokens</h3>
            <p className="mt-1 text-xs text-mist-500">
              Dark surfaces, restrained accents and clear semantic colours.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {colors.map((color) => (
                <ColorSwatch key={color.name} {...color} />
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-medium text-white">Typography</h3>
            <p className="mt-1 text-xs text-mist-500">
              Space Grotesk for headings, DM Sans for reading.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
                  Display · Space Grotesk
                </p>
                <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-white">
                  Build something worth proving.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
                  Body · DM Sans
                </p>
                <p className="mt-1.5 text-sm leading-6 text-mist-300">
                  Clear explanations, short paragraphs and enough whitespace
                  to keep long learning sessions comfortable.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-ink-800 pt-4 text-xs sm:grid-cols-4">
                <div>
                  <p className="font-display text-lg text-white">32px</p>
                  <p className="text-mist-500">Page title</p>
                </div>
                <div>
                  <p className="font-display text-base text-white">20px</p>
                  <p className="text-mist-500">Section</p>
                </div>
                <div>
                  <p className="text-sm text-white">14px</p>
                  <p className="text-mist-500">Body</p>
                </div>
                <div>
                  <p className="text-[11px] text-white">11px</p>
                  <p className="text-mist-500">Caption</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section
        id="buttons"
        title="Buttons"
        description="Every variant, size and state. Click the active buttons to see the shared toast system."
      >
        <Card className="p-5">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
                Variants
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    toast({
                      tone: "info",
                      title: "Primary action",
                      description: "The main action on a screen.",
                    })
                  }
                >
                  Primary action
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    toast({ tone: "info", title: "Secondary action" })
                  }
                >
                  Secondary
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    toast({ tone: "info", title: "Ghost action" })
                  }
                >
                  Ghost
                </Button>
                <Button
                  variant="danger"
                  icon={Trash2}
                  onClick={() =>
                    toast({
                      tone: "danger",
                      title: "Destructive action",
                      description: "Use sparingly and always confirm.",
                    })
                  }
                >
                  Delete
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
                Sizes and icons
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    toast({ tone: "info", title: "Small button" })
                  }
                >
                  Small
                </Button>
                <Button
                  variant="secondary"
                  icon={Plus}
                  onClick={() =>
                    toast({ tone: "info", title: "Medium button" })
                  }
                >
                  Add lesson
                </Button>
                <Button
                  size="lg"
                  iconRight={ArrowUpRight}
                  onClick={() =>
                    toast({ tone: "info", title: "Large button" })
                  }
                >
                  Continue
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
                Loading and disabled
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button loading>Saving</Button>
                <Button variant="secondary" disabled>
                  Disabled
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </Section>

      <Section
        id="forms"
        title="Form controls"
        description="Controlled inputs with labels, hints, validation and accessible password visibility. This preview does not save data."
      >
        <Card>
          <CardHeader
            title="Learning preferences"
            description="A realistic form using the shared controls."
            action={<Badge tone="warning">Preview only</Badge>}
          />

          <form onSubmit={handleSave}>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                icon={User}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
              />

              <Input
                label="Email address"
                type="email"
                icon={Mail}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => setEmailTouched(true)}
                placeholder="you@example.com"
                autoComplete="email"
                hint="Used for assessment reminders."
                error={emailError}
                required
              />

              <Input
                label="Password"
                type="password"
                icon={Lock}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
                hint="Use the eye button to reveal the value."
              />

              <Select
                label="Current week"
                value={week}
                onChange={(event) => setWeek(event.target.value)}
                options={weekOptions}
                hint="Unlock rules will be enforced by the backend."
              />

              <Textarea
                label="Learning goal"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="What do you want to build after this course?"
                maxLength={160}
                hint={`${notes.length}/160 characters`}
                className="sm:col-span-2"
              />

              <div className="sm:col-span-2">
                <Checkbox
                  label="Email me a weekly summary"
                  description="Progress, upcoming assessments and deadlines."
                  checked={notifications}
                  onChange={(event) =>
                    setNotifications(event.target.checked)
                  }
                />
              </div>

              <div className="rounded-lg border border-ink-800 bg-ink-950/50 p-4 sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
                  Live values
                </p>
                <div className="mt-2 grid gap-1.5 text-xs sm:grid-cols-2">
                  <p className="truncate text-mist-400">
                    Name:{" "}
                    <span className="text-mist-200">{fullName || "—"}</span>
                  </p>
                  <p className="truncate text-mist-400">
                    Email:{" "}
                    <span className="text-mist-200">{email || "—"}</span>
                  </p>
                  <p className="truncate text-mist-400">
                    Week:{" "}
                    <span className="text-mist-200">
                      {weekOptions.find((option) => option.value === week)
                        ?.label || "—"}
                    </span>
                  </p>
                  <p className="text-mist-400">
                    Summary:{" "}
                    <span className="text-mist-200">
                      {notifications ? "enabled" : "disabled"}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" size="sm">
                Save preferences
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleReset}
              >
                Reset fields
              </Button>
            </CardFooter>
          </form>
        </Card>
      </Section>

      <Section
        id="cards"
        title="Cards"
        description="Surface, content and course cards share the same border, spacing and hover treatment."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader
              title="Weekly assessment"
              description="Week 02 · CSS fundamentals"
              action={<Badge tone="warning">Due soon</Badge>}
            />
            <CardContent className="flex-1">
              <p className="text-sm leading-6 text-mist-400">
                Complete all four lessons and score at least 60% to unlock
                Week 03. Your highest attempt is kept.
              </p>

              <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-ink-800 bg-ink-950/50 p-4">
                <div>
                  <p className="text-xs font-medium text-mist-200">
                    Assessment progress
                  </p>
                  <p className="mt-0.5 text-[11px] text-mist-500">
                    3 of 4 lessons completed
                  </p>
                </div>
                <span className="font-display text-lg font-semibold text-white">
                  75%
                </span>
              </div>

              <ProgressBar value={75} label="Lessons ready" className="mt-5" />
            </CardContent>
            <CardFooter>
              <Button
                size="sm"
                onClick={() =>
                  toast({
                    tone: "info",
                    title: "Assessment preview",
                    description:
                      "Weekly quizzes, attempts and scores are live in the student workspace. Timed attempts are not enabled.",
                  })
                }
              >
                Review assessment
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  toast({
                    tone: "info",
                    title: "Syllabus preview",
                    description:
                      "Weekly module navigation is available in enrolled courses.",
                  })
                }
              >
                View syllabus
              </Button>
            </CardFooter>
          </Card>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
                Course card · sample content
              </p>
              <Avatar name="Aarav Sharma" size="sm" />
            </div>
            <CourseCard
              course={sampleCourse}
              onContinue={() =>
                toast({
                  tone: "info",
                  title: "Sample course card",
                  description:
                    "Real course data and lesson navigation are available in the student workspace.",
                })
              }
            />
          </div>
        </div>
      </Section>

      <Section
        id="progress"
        title="Progress"
        description="Progress values are always passed in as data. Move the slider to see both indicators update."
      >
        <Card className="p-5">
          <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
            <ProgressRing value={progress} label="Course" />

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">
                  Course completion
                </p>
                <span className="font-display text-lg font-semibold text-white">
                  {progress}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(event) => setProgress(Number(event.target.value))}
                aria-label="Preview progress value"
                className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-800 accent-brand-500"
              />

              <div className="mt-1 flex justify-between text-[10px] text-mist-500">
                <span>0%</span>
                <span>100%</span>
              </div>

              <ProgressBar
                value={progress}
                label="Lessons completed"
                className="mt-5"
              />

              <p className="mt-4 text-xs leading-5 text-mist-500">
                The real certificate rule will require 100% of required lessons
                and all weekly assessments to be passed. Assessments are
                tracked separately so they cannot inflate lesson progress.
              </p>
            </div>
          </div>
        </Card>
      </Section>

      <Section
        id="feedback"
        title="Feedback"
        description="Badges, alerts, empty states and loading skeletons for every important state."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-sm font-medium text-white">Badges</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>Neutral</Badge>
              <Badge tone="brand">In progress</Badge>
              <Badge tone="success" dot>
                Passed
              </Badge>
              <Badge tone="warning" dot>
                Due soon
              </Badge>
              <Badge tone="danger">Locked</Badge>
              <Badge tone="info">New</Badge>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-medium text-white">Avatar</h3>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name="Aarav Sharma" size="xs" />
              <Avatar name="Aarav Sharma" size="sm" />
              <Avatar name="Aarav Sharma" size="md" />
              <Avatar name="Aarav Sharma" size="lg" />
              <div className="ml-2">
                <p className="text-sm font-medium text-mist-200">
                  Aarav Sharma
                </p>
                <p className="text-[11px] text-mist-500">Student · Preview</p>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Alert tone="info" title="Assessment window opens Monday">
              Week 02 becomes available after all four lessons are completed.
            </Alert>

            {successAlertVisible ? (
              <Alert
                tone="success"
                title="Lesson completed"
                onDismiss={() => setSuccessAlertVisible(false)}
              >
                Your progress was recorded. The dismiss button is functional.
              </Alert>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSuccessAlertVisible(true)}
              >
                Show dismissed alert again
              </Button>
            )}

            <Alert tone="warning" title="Week 03 is locked">
              Pass the Week 02 assessment to continue.
            </Alert>
          </div>

          <div className="space-y-4">
            <EmptyState
              icon={BookOpen}
              title="No courses to show"
              description="This is the empty state used when a student has no results for a filter."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    toast({
                      tone: "info",
                      title: "Empty state action",
                      description:
                        "In the real app this would clear filters or open the course catalogue.",
                    })
                  }
                >
                  Trigger preview action
                </Button>
              }
            />

            <Card className="p-5" aria-label="Loading skeleton example">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="mt-2 h-2.5 w-1/3" />
                </div>
              </div>
              <SkeletonText lines={3} className="mt-5" />
            </Card>
          </div>
        </div>
      </Section>

      <Section
        id="overlays"
        title="Overlays"
        description="Dialogs are keyboard accessible: Escape closes them, focus stays inside and returns to the trigger."
      >
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">
              Confirmation dialog
            </h3>
            <p className="mt-1 max-w-xl text-xs leading-5 text-mist-500">
              Used before completing a lesson, submitting an assessment or
              removing a record.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>Open dialog</Button>
        </Card>
      </Section>

      <Section
        id="stats"
        title="Stats"
        description="Compact metrics for dashboards. The values below are sample content for the layout preview."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={BookOpen}
            label="Lessons completed"
            value="18"
            hint="Across 3 active courses"
            tone="brand"
          />
          <StatCard
            icon={Clock}
            label="Learning streak"
            value="6 days"
            hint="Best streak this month"
            tone="cyan"
          />
          <StatCard
            icon={TrendingUp}
            label="Average score"
            value="84%"
            hint="Across 5 assessments"
            tone="success"
          />
        </div>
      </Section>

      <section className="mt-4 rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-500/[0.08] to-cyan-400/[0.03] p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="success" dot>
              Phase 4 student flow
            </Badge>
            <h2 className="mt-3 font-display text-lg font-medium text-white">
              Course learning flow
            </h2>
            <p className="mt-1.5 max-w-xl text-xs leading-5 text-mist-400">
              Students can browse published courses, enrol and view weekly
              lessons. Course authoring and progress tracking remain future work.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/login"
              className={buttonClasses({ variant: "primary", size: "sm" })}
            >
              Open sign in
              <Sparkles size={14} aria-hidden="true" />
            </Link>
            <Link
              to="/"
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              Status page
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-8 flex flex-col gap-2 border-t border-ink-800/70 pt-5 text-[11px] text-mist-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-1.5">
          <GraduationCap size={13} aria-hidden="true" />
          Kodewar LMS · Design system
        </p>
        <p>JavaScript only · React 19 · Tailwind CSS 4</p>
      </footer>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Mark lesson as complete?"
        description="This preview dialog uses the same accessible pattern as the real learning screens."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm}>
              Confirm completion
            </Button>
          </>
        }
      >
        <Alert tone="info" title="Progress is saved by the API">
          The browser will never decide whether a lesson is complete. The
          backend verifies enrollment and stores the result.
        </Alert>

        <p className="mt-4 text-sm leading-6 text-mist-400">
          In the student course page this action calls the lesson progress
          endpoint and updates unlock state and the course completion
          percentage.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
