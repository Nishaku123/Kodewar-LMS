import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card, CardContent, CardHeader } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/staff/ConfirmDialog.jsx";
import AssignmentFormModal from "../../components/staff/AssignmentFormModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import { formatDateTime } from "../../utils/roles.js";
import {
  deleteAssignmentRequest,
  getAssignmentSubmissionsRequest,
  getManagedAssignmentRequest,
  gradeSubmissionRequest,
  setAssignmentPublishedRequest,
} from "../../services/manage.js";

function GradeModal({ open, submission, maxPoints, onClose, onSave }) {
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !submission) return;
    setScore(submission.score ?? "");
    setFeedback(submission.feedback || "");
    setError("");
  }, [open, submission]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const numericScore = Number(score);

    if (!Number.isFinite(numericScore) || numericScore < 0) {
      setError("Score must be zero or more.");
      setSaving(false);
      return;
    }

    if (numericScore > maxPoints) {
      setError(`Score cannot be more than ${maxPoints}.`);
      setSaving(false);
      return;
    }

    try {
      await onSave({ score: numericScore, feedback });
      onClose();
    } catch (requestError) {
      setError(requestError.message || "Could not grade this submission.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Grade submission"
      description={
        submission
          ? `${submission.studentName} · ${submission.studentEmail}`
          : "Student submission"
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="grade-form" loading={saving}>
            Save grade
          </Button>
        </>
      }
    >
      <form id="grade-form" className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-400/20 bg-rose-400/5 px-3 py-2.5 text-xs text-rose-200"
          >
            {error}
          </div>
        ) : null}

        <div className="rounded-lg border border-ink-800 bg-ink-950/40 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-mist-500">
            <FileText size={13} aria-hidden="true" />
            Student answer
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-mist-200">
            {submission?.content}
          </p>
          {submission?.submissionUrl ? (
            <a
              href={submission.submissionUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs font-semibold text-brand-300 underline underline-offset-4"
            >
              Open submitted link
            </a>
          ) : null}
        </div>

        <Input
          label={`Score (out of ${maxPoints})`}
          type="number"
          min={0}
          max={maxPoints}
          step="0.5"
          required
          value={score}
          onChange={(event) => setScore(event.target.value)}
        />

        <Textarea
          label="Feedback"
          rows={4}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="What did the student do well? What could improve?"
          maxLength={5000}
        />
      </form>
    </Modal>
  );
}

export default function StaffAssignment() {
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user.role === "admin";

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [grading, setGrading] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [busy, setBusy] = useState("");

  const loadAssignment = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setStatus("loading");
    setError("");

    try {
      const [assignmentResponse, submissionsResponse] = await Promise.all([
        getManagedAssignmentRequest(assignmentId),
        getAssignmentSubmissionsRequest(assignmentId),
      ]);
      setAssignment(assignmentResponse.data.assignment);
      setSubmissions(submissionsResponse.data.submissions);
      setSummary(submissionsResponse.data.summary);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message || "Could not load the assignment.");
      setStatus("error");
    }
  }, [assignmentId]);

  const refreshAssignment = useCallback(
    () => loadAssignment({ silent: true }),
    [loadAssignment]
  );

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  async function togglePublish() {
    setBusy("publish");

    try {
      await setAssignmentPublishedRequest(assignment.id, !assignment.isPublished);
      toast({
        tone: "success",
        title: assignment.isPublished
          ? "Assignment unpublished"
          : "Assignment published",
      });
      await refreshAssignment();
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not change publication",
        description: requestError.message,
      });
    } finally {
      setBusy("");
    }
  }

  async function saveGrade(data) {
    await gradeSubmissionRequest(grading.id, data);
    toast({
      tone: "success",
      title: "Submission graded",
      description: `${grading.studentName} scored ${data.score}/${assignment.maxPoints}.`,
    });
    await refreshAssignment();
  }

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

  function askDeleteAssignment() {
    setConfirm({
      title: "Delete this assignment?",
      description: assignment.title,
      confirmLabel: "Delete assignment",
      action: async () => {
        await deleteAssignmentRequest(assignment.id);
        toast({ tone: "success", title: "Assignment deleted" });
        navigate(`/staff/courses/${assignment.courseId}`);
      },
    });
  }

  if (status === "loading") {
    return (
      <DashboardLayout
        title="Assignment"
        subtitle="Loading submissions"
        navItems={getNavigation(user.role)}
      >
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="mt-5 h-64 rounded-xl" />
      </DashboardLayout>
    );
  }

  if (status === "error" || !assignment) {
    return (
      <DashboardLayout
        title="Assignment"
        subtitle="Assignment unavailable"
        navItems={getNavigation(user.role)}
      >
        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-200"
        >
          <p>{error || "This assignment could not be found."}</p>
          <button
            type="button"
            onClick={() => loadAssignment()}
            className="mt-3 font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={assignment.title}
      subtitle="Assignment submissions"
      navItems={getNavigation(user.role)}
    >
      <Link
        to={`/staff/courses/${assignment.courseId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-mist-400 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to {assignment.courseTitle}
      </Link>

      <PageHeader
        eyebrow={`Week ${assignment.weekNumber} · ${assignment.moduleTitle}`}
        title={assignment.title}
        description={assignment.description || "No description yet."}
        actions={
          <>
            <Button
              variant="secondary"
              icon={Pencil}
              onClick={() => setSettingsOpen(true)}
            >
              Settings
            </Button>
            <Button
              variant={assignment.isPublished ? "secondary" : "primary"}
              icon={assignment.isPublished ? EyeOff : Eye}
              loading={busy === "publish"}
              onClick={togglePublish}
            >
              {assignment.isPublished ? "Unpublish" : "Publish"}
            </Button>
            {isAdmin ? (
              <Button variant="ghost" icon={Trash2} onClick={askDeleteAssignment}>
                Delete
              </Button>
            ) : null}
          </>
        }
      />

      <div className="space-y-5">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <Badge tone={assignment.isPublished ? "success" : "warning"} dot>
              {assignment.isPublished ? "Published" : "Draft"}
            </Badge>
            <Badge tone="neutral">{assignment.maxPoints} points</Badge>
            <Badge tone="neutral">
              {assignment.dueAt
                ? `Due ${formatDateTime(assignment.dueAt)}`
                : "No due date"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={() => loadAssignment()}
            >
              Refresh
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader title="Instructions" description="What students see" />
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-mist-300">
                {assignment.instructions || "No instructions yet."}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2">
            <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-4">
              <p className="text-xs text-mist-400">Submissions</p>
              <p className="mt-2 font-display text-2xl font-semibold text-white">
                {summary?.total ?? submissions.length}
              </p>
            </div>
            <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-4">
              <p className="text-xs text-mist-400">Graded</p>
              <p className="mt-2 font-display text-2xl font-semibold text-white">
                {summary?.graded ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-4">
              <p className="text-xs text-mist-400">Pending</p>
              <p className="mt-2 font-display text-2xl font-semibold text-white">
                {summary?.pending ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-4">
              <p className="text-xs text-mist-400">Average score</p>
              <p className="mt-2 font-display text-2xl font-semibold text-white">
                {summary?.averageScore ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader
            title="Student submissions"
            description="Review written work and submitted links, then grade."
          />
          <CardContent className="space-y-3">
            {submissions.length ? (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-lg border border-ink-800 bg-ink-950/30 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-mist-100">
                        {submission.studentName}
                      </p>
                      <p className="truncate text-[11px] text-mist-500">
                        {submission.studentEmail} · submitted{" "}
                        {formatDateTime(submission.submittedAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          submission.status === "graded" ? "success" : "warning"
                        }
                      >
                        {submission.status === "graded" ? "Graded" : "Pending"}
                      </Badge>
                      {submission.status === "graded" ? (
                        <Badge tone="brand">
                          {submission.score}/{assignment.maxPoints}
                        </Badge>
                      ) : null}
                      {submission.isLate ? (
                        <Badge tone="warning">Late</Badge>
                      ) : null}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setGrading(submission)}
                      >
                        {submission.status === "graded"
                          ? "Change grade"
                          : "Grade"}
                      </Button>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-mist-400">
                    {submission.content}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mist-500">
                    {submission.submissionUrl ? (
                      <a
                        href={submission.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-300 underline underline-offset-4"
                      >
                        Submitted link
                      </a>
                    ) : null}
                    {submission.gradedAt ? (
                      <span>
                        Graded {formatDateTime(submission.gradedAt)}
                        {submission.gradedByName
                          ? ` by ${submission.gradedByName}`
                          : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={FileText}
                title="No submissions yet"
                description={
                  assignment.isPublished
                    ? "Students will appear here after they submit their work."
                    : "Publish this assignment so students can submit it."
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <AssignmentFormModal
        open={settingsOpen}
        moduleId={assignment.moduleId}
        assignment={assignment}
        onClose={() => setSettingsOpen(false)}
        onSaved={refreshAssignment}
      />

      <GradeModal
        open={Boolean(grading)}
        submission={grading}
        maxPoints={assignment.maxPoints}
        onClose={() => setGrading(null)}
        onSave={saveGrade}
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
    </DashboardLayout>
  );
}
