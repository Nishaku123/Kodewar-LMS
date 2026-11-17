import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Circle,
  Eye,
  EyeOff,
  Pencil,
  Plus,
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
import Checkbox from "../../components/ui/Checkbox.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ConfirmDialog from "../../components/staff/ConfirmDialog.jsx";
import AssessmentFormModal from "../../components/staff/AssessmentFormModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import { formatDateTime } from "../../utils/roles.js";
import {
  createOptionRequest,
  createQuestionRequest,
  deleteAssessmentRequest,
  deleteOptionRequest,
  deleteQuestionRequest,
  getAssessmentAttemptsRequest,
  getManagedAssessmentRequest,
  setAssessmentPublishedRequest,
  updateOptionRequest,
  updateQuestionRequest,
} from "../../services/manage.js";

function errorText(error) {
  if (Array.isArray(error.details) && error.details.length) {
    return error.details.map((detail) => detail.message).join(" ");
  }
  return error.message || "Please try again.";
}

function QuestionFormModal({ open, question, onClose, onSave }) {
  const [form, setForm] = useState({
    prompt: "",
    explanation: "",
    points: 1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      prompt: question?.prompt || "",
      explanation: question?.explanation || "",
      points: question?.points ?? 1,
    });
    setError("");
  }, [open, question]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSave({
        prompt: form.prompt,
        explanation: form.explanation,
        points: Number(form.points),
      });
      onClose();
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={question ? "Edit question" : "New question"}
      description="Questions can only be changed while the assessment is a draft."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="question-form" loading={saving}>
            {question ? "Save changes" : "Add question"}
          </Button>
        </>
      }
    >
      <form id="question-form" className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-400/20 bg-rose-400/5 px-3 py-2.5 text-xs text-rose-200"
          >
            {error}
          </div>
        ) : null}

        <Textarea
          label="Question"
          rows={3}
          required
          value={form.prompt}
          onChange={(event) =>
            setForm((current) => ({ ...current, prompt: event.target.value }))
          }
          placeholder="What should the student answer?"
          maxLength={2000}
        />

        <Textarea
          label="Explanation"
          rows={2}
          value={form.explanation}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              explanation: event.target.value,
            }))
          }
          placeholder="Shown to students after grading."
          maxLength={2000}
        />

        <Input
          label="Points"
          type="number"
          min={1}
          max={100}
          required
          value={form.points}
          onChange={(event) =>
            setForm((current) => ({ ...current, points: event.target.value }))
          }
        />
      </form>
    </Modal>
  );
}

function OptionFormModal({ open, option, onClose, onSave }) {
  const [form, setForm] = useState({ text: "", isCorrect: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      text: option?.text || "",
      isCorrect: Boolean(option?.isCorrect),
    });
    setError("");
  }, [open, option]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSave({ text: form.text, isCorrect: form.isCorrect });
      onClose();
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={option ? "Edit option" : "New option"}
      description="Each question needs at least two options and exactly one correct answer before it can be published."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="option-form" loading={saving}>
            {option ? "Save option" : "Add option"}
          </Button>
        </>
      }
    >
      <form id="option-form" className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-400/20 bg-rose-400/5 px-3 py-2.5 text-xs text-rose-200"
          >
            {error}
          </div>
        ) : null}

        <Input
          label="Option text"
          required
          value={form.text}
          onChange={(event) =>
            setForm((current) => ({ ...current, text: event.target.value }))
          }
          placeholder="Answer choice"
          maxLength={500}
        />

        <Checkbox
          label="This is the correct answer"
          checked={form.isCorrect}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              isCorrect: event.target.checked,
            }))
          }
        />
      </form>
    </Modal>
  );
}

export default function StaffAssessment() {
  const { assessmentId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user.role === "admin";

  const [assessment, setAssessment] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [attemptSummary, setAttemptSummary] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [questionModal, setQuestionModal] = useState({
    open: false,
    question: null,
  });
  const [optionModal, setOptionModal] = useState({
    open: false,
    question: null,
    option: null,
  });
  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [busy, setBusy] = useState("");

  const loadAssessment = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setStatus("loading");
    setError("");

    try {
      const [assessmentResponse, attemptsResponse] = await Promise.all([
        getManagedAssessmentRequest(assessmentId),
        getAssessmentAttemptsRequest(assessmentId),
      ]);
      setAssessment(assessmentResponse.data.assessment);
      setAttempts(attemptsResponse.data.attempts);
      setAttemptSummary(attemptsResponse.data.summary);
      setStatus("success");
    } catch (requestError) {
      setError(requestError.message || "Could not load the assessment.");
      setStatus("error");
    }
  }, [assessmentId]);

  const refreshAssessment = useCallback(
    () => loadAssessment({ silent: true }),
    [loadAssessment]
  );

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  async function togglePublish() {
    setBusy("publish");

    try {
      await setAssessmentPublishedRequest(assessment.id, !assessment.isPublished);
      toast({
        tone: "success",
        title: assessment.isPublished
          ? "Assessment unpublished"
          : "Assessment published",
      });
      await refreshAssessment();
    } catch (requestError) {
      toast({
        tone: "danger",
        title: "Could not change publication",
        description: errorText(requestError),
      });
    } finally {
      setBusy("");
    }
  }

  async function saveQuestion(data) {
    if (questionModal.question) {
      await updateQuestionRequest(questionModal.question.id, data);
      toast({ tone: "success", title: "Question updated" });
    } else {
      await createQuestionRequest(assessment.id, data);
      toast({ tone: "success", title: "Question added" });
    }
    await refreshAssessment();
  }

  async function saveOption(data) {
    const { question, option } = optionModal;

    if (data.isCorrect) {
      const otherCorrect = question.options.filter(
        (item) => item.isCorrect && item.id !== option?.id
      );

      if (otherCorrect.length) {
        await Promise.all(
          otherCorrect.map((item) =>
            updateOptionRequest(item.id, { isCorrect: false })
          )
        );
      }
    }

    if (option) {
      await updateOptionRequest(option.id, data);
      toast({ tone: "success", title: "Option updated" });
    } else {
      await createOptionRequest(question.id, data);
      toast({ tone: "success", title: "Option added" });
    }

    await refreshAssessment();
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
        description: errorText(requestError),
      });
    } finally {
      setConfirmLoading(false);
    }
  }

  function askDeleteQuestion(question) {
    setConfirm({
      title: "Delete this question?",
      description: question.prompt,
      confirmLabel: "Delete question",
      action: async () => {
        await deleteQuestionRequest(question.id);
        toast({ tone: "success", title: "Question deleted" });
        await refreshAssessment();
      },
    });
  }

  function askDeleteOption(option) {
    setConfirm({
      title: "Delete this option?",
      description: option.text,
      confirmLabel: "Delete option",
      action: async () => {
        await deleteOptionRequest(option.id);
        toast({ tone: "success", title: "Option deleted" });
        await refreshAssessment();
      },
    });
  }

  function askDeleteAssessment() {
    setConfirm({
      title: "Delete this assessment?",
      description: assessment.title,
      confirmLabel: "Delete assessment",
      action: async () => {
        await deleteAssessmentRequest(assessment.id);
        toast({ tone: "success", title: "Assessment deleted" });
        navigate(`/staff/courses/${assessment.courseId}`);
      },
    });
  }

  if (status === "loading") {
    return (
      <DashboardLayout
        title="Assessment"
        subtitle="Loading questions"
        navItems={getNavigation(user.role)}
      >
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="mt-5 h-64 rounded-xl" />
      </DashboardLayout>
    );
  }

  if (status === "error" || !assessment) {
    return (
      <DashboardLayout
        title="Assessment"
        subtitle="Assessment unavailable"
        navItems={getNavigation(user.role)}
      >
        <div
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-200"
        >
          <p>{error || "This assessment could not be found."}</p>
          <button
            type="button"
            onClick={() => loadAssessment()}
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
      title={assessment.title}
      subtitle="Assessment builder"
      navItems={getNavigation(user.role)}
    >
      <Link
        to={`/staff/courses/${assessment.courseId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-mist-400 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to {assessment.courseTitle}
      </Link>

      <PageHeader
        eyebrow={`Week ${assessment.weekNumber} · ${assessment.moduleTitle}`}
        title={assessment.title}
        description={assessment.description || "No description yet."}
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
              variant={assessment.isPublished ? "secondary" : "primary"}
              icon={assessment.isPublished ? EyeOff : Eye}
              loading={busy === "publish"}
              onClick={togglePublish}
            >
              {assessment.isPublished ? "Unpublish" : "Publish"}
            </Button>
            {isAdmin ? (
              <Button variant="ghost" icon={Trash2} onClick={askDeleteAssessment}>
                Delete
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={assessment.isPublished ? "success" : "warning"} dot>
              {assessment.isPublished ? "Published" : "Draft"}
            </Badge>
            <Badge tone="neutral">{assessment.questions.length} questions</Badge>
            <Badge tone="neutral">Pass {assessment.passingScore}%</Badge>
            <Badge tone="neutral">
              {assessment.maxAttempts === 0
                ? "Unlimited attempts"
                : `${assessment.maxAttempts} attempts`}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={() => loadAssessment()}
            >
              Refresh
            </Button>
          </div>

          {assessment.isPublished ? (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-xs leading-5 text-cyan-100">
              This assessment is published. Unpublish it to add or edit questions
              and options.
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-medium text-white">
              Questions
            </h2>
            {!assessment.isPublished ? (
              <Button
                icon={Plus}
                size="sm"
                onClick={() => setQuestionModal({ open: true, question: null })}
              >
                Add question
              </Button>
            ) : null}
          </div>

          {assessment.questions.length ? (
            assessment.questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader
                  title={`${index + 1}. ${question.prompt}`}
                  description={`${question.points} ${
                    question.points === 1 ? "point" : "points"
                  }${question.explanation ? " · explanation included" : ""}`}
                  action={
                    !assessment.isPublished ? (
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Pencil}
                          onClick={() =>
                            setQuestionModal({ open: true, question })
                          }
                        >
                          Edit
                        </Button>
                        {isAdmin ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => askDeleteQuestion(question)}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    ) : null
                  }
                />
                <CardContent className="space-y-2">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className={`flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between ${
                        option.isCorrect
                          ? "border-emerald-400/30 bg-emerald-400/5"
                          : "border-ink-800 bg-ink-950/30"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {option.isCorrect ? (
                          <Check
                            size={15}
                            className="shrink-0 text-emerald-300"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            size={13}
                            className="shrink-0 text-mist-600"
                            aria-hidden="true"
                          />
                        )}
                        <span className="text-sm text-mist-100">
                          {option.text}
                        </span>
                        {option.isCorrect ? (
                          <Badge tone="success">Correct</Badge>
                        ) : null}
                      </div>

                      {!assessment.isPublished ? (
                        <div className="flex shrink-0 gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Pencil}
                            onClick={() =>
                              setOptionModal({
                                open: true,
                                question,
                                option,
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
                              onClick={() => askDeleteOption(option)}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}

                  {!assessment.isPublished ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Plus}
                      onClick={() =>
                        setOptionModal({ open: true, question, option: null })
                      }
                    >
                      Add option
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={Plus}
              title="No questions yet"
              description="Add at least one question with two options and one correct answer before publishing."
              action={
                <Button
                  icon={Plus}
                  onClick={() =>
                    setQuestionModal({ open: true, question: null })
                  }
                >
                  Add question
                </Button>
              }
            />
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Attempts" description="Latest student attempts" />
            <CardContent>
              {attemptSummary ? (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg border border-ink-800 bg-ink-950/30 p-3">
                    <p className="font-display text-xl text-white">
                      {attemptSummary.total}
                    </p>
                    <p className="mt-0.5 text-[11px] text-mist-500">Started</p>
                  </div>
                  <div className="rounded-lg border border-ink-800 bg-ink-950/30 p-3">
                    <p className="font-display text-xl text-white">
                      {attemptSummary.submitted}
                    </p>
                    <p className="mt-0.5 text-[11px] text-mist-500">Submitted</p>
                  </div>
                  <div className="rounded-lg border border-ink-800 bg-ink-950/30 p-3">
                    <p className="font-display text-xl text-white">
                      {attemptSummary.passed}
                    </p>
                    <p className="mt-0.5 text-[11px] text-mist-500">Passed</p>
                  </div>
                  <div className="rounded-lg border border-ink-800 bg-ink-950/30 p-3">
                    <p className="font-display text-xl text-white">
                      {attemptSummary.averageScore ?? "—"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-mist-500">
                      Average score
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 space-y-2">
                {attempts.length ? (
                  attempts.slice(0, 8).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="rounded-lg border border-ink-800 bg-ink-950/30 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-mist-200">
                          {attempt.studentName}
                        </p>
                        <Badge
                          tone={
                            attempt.passed
                              ? "success"
                              : attempt.status === "submitted"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {attempt.status === "submitted"
                            ? attempt.passed
                              ? "Passed"
                              : "Not passed"
                            : "In progress"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-mist-500">
                        {attempt.status === "submitted"
                          ? `Score ${attempt.score}% · ${formatDateTime(
                              attempt.submittedAt
                            )}`
                          : `Started ${formatDateTime(attempt.startedAt)}`}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-mist-500">No attempts yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AssessmentFormModal
        open={settingsOpen}
        moduleId={assessment.moduleId}
        assessment={assessment}
        onClose={() => setSettingsOpen(false)}
        onSaved={refreshAssessment}
      />

      <QuestionFormModal
        open={questionModal.open}
        question={questionModal.question}
        onClose={() =>
          setQuestionModal({ open: false, question: null })
        }
        onSave={saveQuestion}
      />

      <OptionFormModal
        open={optionModal.open}
        option={optionModal.option}
        onClose={() =>
          setOptionModal({ open: false, question: null, option: null })
        }
        onSave={saveOption}
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
