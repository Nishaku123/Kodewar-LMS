import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Lock,
  Send,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card, CardContent, CardHeader } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button, { buttonClasses } from "../../components/ui/Button.jsx";
import Alert from "../../components/ui/Alert.jsx";
import Input from "../../components/ui/Input.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import {
  getAssignmentRequest,
  submitAssignmentRequest,
} from "../../services/assignments.js";
import { formatDate, formatDateTime } from "../../utils/roles.js";

export default function StudentAssignmentDetail() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [content, setContent] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");

    getAssignmentRequest(assignmentId)
      .then((response) => {
        if (!active) return;
        const loaded = response.data.assignment;
        setAssignment(loaded);
        setContent(loaded.submission?.content || "");
        setSubmissionUrl(loaded.submission?.submissionUrl || "");
      })
      .catch((requestError) => {
        if (active) {
          setLoadError(
            requestError.message || "Could not load this assignment."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [assignmentId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!content.trim() && !submissionUrl.trim()) {
      setFormError(
        "Write your submission or add a link before submitting the assignment."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await submitAssignmentRequest(assignmentId, {
        content: content.trim(),
        submissionUrl: submissionUrl.trim(),
      });
      setAssignment((current) => ({
        ...current,
        submission: response.data.submission,
        isLate: Boolean(response.data.submission?.isLate),
      }));
      toast({
        tone: "success",
        title: assignment.submission
          ? "Submission updated"
          : "Assignment submitted",
        description: "Your trainer can now review your work.",
      });
    } catch (requestError) {
      setFormError(
        requestError.message || "Could not submit this assignment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const submission = assignment?.submission;
  const isGraded = submission?.status === "graded";

  return (
    <DashboardLayout
      title="Assignment"
      subtitle="Your Kodewar learning workspace"
      navItems={getNavigation(user.role)}
    >
      <div className="mb-5">
        <Link
          to="/student/assignments"
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to assignments
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : loadError ? (
        <Alert tone="danger" title="Could not load assignment">
          {loadError}
        </Alert>
      ) : assignment ? (
        <>
          <PageHeader
            eyebrow={`Week ${assignment.module.weekNumber} · ${assignment.module.title}`}
            title={assignment.title}
            description={assignment.description}
            actions={
              <Badge
                tone={
                  isGraded
                    ? "success"
                    : submission
                      ? "info"
                      : assignment.isUnlocked
                        ? "brand"
                        : "neutral"
                }
                dot
              >
                {isGraded
                  ? "Graded"
                  : submission
                    ? "Submitted"
                    : assignment.isUnlocked
                      ? "Available"
                      : "Locked"}
              </Badge>
            }
          />

          <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-mist-500">
            <span>{assignment.maxPoints} points</span>
            {assignment.dueAt ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={14} aria-hidden="true" />
                Due {formatDate(assignment.dueAt)}
                {assignment.isPastDue && !isGraded ? " (past due)" : ""}
              </span>
            ) : (
              <span>No due date</span>
            )}
            {assignment.isLate ? (
              <Badge tone="warning">Submitted late</Badge>
            ) : null}
            <Link
              to={`/student/courses/${assignment.course.id}`}
              className="text-brand-300 underline-offset-4 hover:underline"
            >
              {assignment.course.title}
            </Link>
          </div>

          {isGraded ? (
            <div className="mb-5">
              <Alert tone="success" title="This assignment has been graded">
                Score: {submission.score} of {assignment.maxPoints}. Graded{" "}
                {formatDateTime(submission.gradedAt)}.
                {submission.feedback ? ` Feedback: ${submission.feedback}` : ""}
              </Alert>
            </div>
          ) : null}

          {!assignment.isUnlocked ? (
            <Alert tone="warning" title="This assignment is locked">
              Complete every lesson in the week before submitting. Open the{" "}
              <Link
                to={`/student/courses/${assignment.course.id}`}
                className="font-semibold underline underline-offset-2"
              >
                course
              </Link>{" "}
              to continue.
            </Alert>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
              <Card>
                <CardHeader
                  title="Instructions"
                  description="Read the task before writing your submission"
                />
                <CardContent>
                  <p className="whitespace-pre-line text-sm leading-6 text-mist-300">
                    {assignment.instructions}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title={isGraded ? "Your graded submission" : "Your submission"}
                  description={
                    isGraded
                      ? "Graded work can no longer be changed"
                      : "Write your answer and optionally add a link"
                  }
                />
                <CardContent>
                  {isGraded ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                          Answer
                        </p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-mist-200">
                          {submission.content || "No written answer."}
                        </p>
                      </div>
                      {submission.submissionUrl ? (
                        <a
                          href={submission.submissionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-brand-300 underline-offset-4 hover:underline"
                        >
                          Open submitted link
                          <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      ) : null}
                      <p className="border-t border-ink-800 pt-3 text-xs text-mist-500">
                        Submitted {formatDateTime(submission.submittedAt)}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {formError ? (
                        <Alert tone="danger" title="Could not submit">
                          {formError}
                        </Alert>
                      ) : null}

                      <Textarea
                        label="Written answer"
                        rows={7}
                        value={content}
                        maxLength={10000}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder="Describe what you built and how it works…"
                        hint="Up to 10,000 characters."
                      />

                      <Input
                        label="Link (optional)"
                        type="url"
                        value={submissionUrl}
                        onChange={(event) =>
                          setSubmissionUrl(event.target.value)
                        }
                        placeholder="https://example.com/my-work"
                        hint="A repository, document or hosted demo."
                      />

                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="submit"
                          icon={Send}
                          loading={submitting}
                        >
                          {submission ? "Update submission" : "Submit assignment"}
                        </Button>
                        {submission ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
                            <CheckCircle2 size={14} aria-hidden="true" />
                            Submitted {formatDateTime(submission.submittedAt)}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs leading-5 text-mist-500">
                        You can update your submission until a trainer grades
                        it.
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : null}
    </DashboardLayout>
  );
}
