import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ListChecks,
  Lock,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import PageHeader from "../../components/layout/PageHeader.jsx";
import { Card, CardContent, CardHeader } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button, { buttonClasses } from "../../components/ui/Button.jsx";
import Alert from "../../components/ui/Alert.jsx";
import ProgressBar from "../../components/ui/ProgressBar.jsx";
import ProgressRing from "../../components/ui/ProgressRing.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getNavigation } from "../../config/navigation.js";
import {
  getAssessmentAttemptRequest,
  getAssessmentRequest,
  startAssessmentAttemptRequest,
  submitAssessmentAttemptRequest,
} from "../../services/assessments.js";
import { formatDateTime } from "../../utils/roles.js";

function optionText(assessment, questionId, optionId) {
  if (!optionId) return "Not answered";
  const question = assessment?.questions.find((item) => item.id === questionId);
  return (
    question?.options.find((option) => option.id === optionId)?.text ||
    "No longer available"
  );
}

function ResultView({ assessment, result, onReview, onRetake, retakeLoading }) {
  const { attempt, answers } = result;
  const passed = Boolean(attempt.passed);

  return (
    <div className="space-y-5">
      <Card
        className={
          passed
            ? "border-emerald-400/25 bg-gradient-to-br from-emerald-400/[0.08] via-ink-900/60 to-ink-900/60"
            : "border-amber-300/25 bg-gradient-to-br from-amber-300/[0.06] via-ink-900/60 to-ink-900/60"
        }
      >
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <ProgressRing value={attempt.score} size={132} label="Score" />

          <div className="min-w-0 flex-1">
            <Badge tone={passed ? "success" : "warning"} dot>
              {passed ? "Passed" : "Not passed yet"}
            </Badge>
            <h2 className="mt-3 font-display text-xl font-semibold text-white">
              Attempt {attempt.attemptNumber} submitted
            </h2>
            <p className="mt-1 text-sm leading-6 text-mist-400">
              You earned {attempt.earnedPoints} of {attempt.totalPoints} points.
              The pass mark is {result.assessment.passingScore}%.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-mist-500">
              <span>
                Attempts used: {result.assessment.attemptsUsed}
                {result.assessment.maxAttempts
                  ? ` of ${result.assessment.maxAttempts}`
                  : " (unlimited)"}
              </span>
              <span>
                Submitted {formatDateTime(attempt.submittedAt)}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/student/assessments"
                className={buttonClasses({ variant: "secondary", size: "sm" })}
              >
                Back to assessments
              </Link>
              {result.assessment.canRetake ? (
                <Button
                  size="sm"
                  loading={retakeLoading}
                  icon={RotateCcw}
                  onClick={onRetake}
                >
                  Try again
                </Button>
              ) : null}
              {!passed && !result.assessment.canRetake ? (
                <span className="self-center text-xs text-mist-500">
                  No attempts remain. Review the explanations below and speak to
                  your trainer.
                </span>
              ) : null}
            </div>
          </div>

          {onReview ? (
            <Button variant="ghost" size="sm" onClick={onReview}>
              Review an earlier attempt
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Question review"
          description="Correct answers and explanations are shown after submission."
        />
        <CardContent className="space-y-4">
          {answers.map((answer, index) => {
            const selected = optionText(
              assessment,
              answer.questionId,
              answer.selectedOptionId
            );
            const correct = optionText(
              assessment,
              answer.questionId,
              answer.correctOptionId
            );

            return (
              <div
                key={answer.questionId}
                className="rounded-lg border border-ink-800 bg-ink-950/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-white">
                    {index + 1}. {answer.prompt}
                  </p>
                  <span
                    className={
                      answer.isCorrect
                        ? "shrink-0 text-emerald-300"
                        : "shrink-0 text-rose-300"
                    }
                  >
                    {answer.isCorrect ? (
                      <CheckCircle2 size={18} aria-label="Correct" />
                    ) : (
                      <XCircle size={18} aria-label="Incorrect" />
                    )}
                  </span>
                </div>

                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="text-mist-500">Your answer:</dt>
                    <dd
                      className={
                        answer.isCorrect ? "text-emerald-200" : "text-rose-200"
                      }
                    >
                      {selected}
                    </dd>
                  </div>
                  {!answer.isCorrect ? (
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-mist-500">Correct answer:</dt>
                      <dd className="text-emerald-200">{correct}</dd>
                    </div>
                  ) : null}
                  {answer.explanation ? (
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-mist-500">Why:</dt>
                      <dd className="text-mist-300">{answer.explanation}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function QuizView({
  assessment,
  answers,
  onSelect,
  onSubmit,
  submitting,
  actionError,
}) {
  const answeredCount = Object.keys(answers).length;
  const total = assessment.questions.length;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">
                Attempt {assessment.activeAttempt.attemptNumber}
              </p>
              <h2 className="mt-1 font-display text-lg font-medium text-white">
                Answer every question you can
              </h2>
            </div>
            <Badge tone="neutral">
              {answeredCount} of {total} answered
            </Badge>
          </div>

          <ProgressBar
            value={total ? (answeredCount / total) * 100 : 0}
            label="Answered"
            className="mt-4"
          />

          <p className="mt-3 text-xs leading-5 text-mist-500">
            Unanswered questions are marked incorrect. Your attempt is saved only
            when you submit it, and it cannot be changed afterwards.
          </p>
        </CardContent>
      </Card>

      {actionError ? <Alert tone="danger" title="Could not submit">{actionError}</Alert> : null}

      {assessment.questions.map((question, index) => (
        <Card key={question.id}>
          <CardContent>
            <fieldset>
              <legend className="text-sm font-medium leading-6 text-white">
                {index + 1}. {question.prompt}
              </legend>
              <p className="mt-1 text-[11px] text-mist-500">
                {question.points}{" "}
                {question.points === 1 ? "point" : "points"}
              </p>

              <div className="mt-4 space-y-2">
                {question.options.map((option) => {
                  const checked = answers[question.id] === option.id;

                  return (
                    <label
                      key={option.id}
                      className={
                        checked
                          ? "flex cursor-pointer items-start gap-3 rounded-lg border border-brand-500/50 bg-brand-500/10 px-3 py-2.5 text-sm text-white"
                          : "flex cursor-pointer items-start gap-3 rounded-lg border border-ink-700 bg-ink-950/40 px-3 py-2.5 text-sm text-mist-300 transition-colors hover:border-ink-600 hover:text-white"
                      }
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.id}
                        checked={checked}
                        onChange={() => onSelect(question.id, option.id)}
                        className="mt-0.5 h-4 w-4 accent-brand-500"
                      />
                      <span>{option.text}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          loading={submitting}
          icon={ListChecks}
          onClick={onSubmit}
          disabled={answeredCount === 0}
        >
          Submit attempt
        </Button>
        <Link
          to="/student/assessments"
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          Save for later
        </Link>
        <span className="text-xs text-mist-500">
          Your started attempt stays open until you submit it.
        </span>
      </div>
    </div>
  );
}

export default function StudentAssessmentDetail() {
  const { user } = useAuth();
  const { assessmentId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingAttemptId, setReviewingAttemptId] = useState(null);

  const loadAssessment = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await getAssessmentRequest(assessmentId);
      setAssessment(response.data.assessment);
    } catch (requestError) {
      setLoadError(
        requestError.message || "Could not load this assessment."
      );
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  const latestAttemptId = useMemo(
    () => assessment?.attempts?.[0]?.id ?? null,
    [assessment]
  );

  async function handleStart() {
    setStarting(true);
    setActionError("");
    setResult(null);

    try {
      const response = await startAssessmentAttemptRequest(assessmentId);
      setAssessment((current) => ({
        ...current,
        activeAttempt: response.data.attempt,
      }));
      setAnswers({});
    } catch (requestError) {
      setActionError(requestError.message || "Could not start an attempt.");
      await loadAssessment();
    } finally {
      setStarting(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setActionError("");

    try {
      const payload = Object.entries(answers).map(([questionId, optionId]) => ({
        questionId: Number(questionId),
        optionId,
      }));
      const response = await submitAssessmentAttemptRequest(
        assessmentId,
        assessment.activeAttempt.id,
        payload
      );
      setResult(response.data);
      setAnswers({});
      setAssessment((current) => ({
        ...current,
        activeAttempt: null,
        attempts: [response.data.attempt, ...current.attempts],
      }));
    } catch (requestError) {
      setActionError(requestError.message || "Could not submit this attempt.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviewAttempt(attemptId) {
    setReviewingAttemptId(attemptId);
    setActionError("");

    try {
      const response = await getAssessmentAttemptRequest(
        assessmentId,
        attemptId
      );
      setResult(response.data);
    } catch (requestError) {
      setActionError(requestError.message || "Could not load that attempt.");
    } finally {
      setReviewingAttemptId(null);
    }
  }

  function handleSelect(questionId, optionId) {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
  }

  const showQuiz = Boolean(assessment?.activeAttempt) && !result;

  return (
    <DashboardLayout
      title="Assessment"
      subtitle="Your Kodewar learning workspace"
      navItems={getNavigation(user.role)}
    >
      <div className="mb-5">
        <Link
          to="/student/assessments"
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to assessments
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : loadError ? (
        <Alert tone="danger" title="Could not load assessment">
          {loadError}
        </Alert>
      ) : assessment ? (
        <>
          <PageHeader
            eyebrow={`Week ${assessment.module.weekNumber} · ${assessment.module.title}`}
            title={assessment.title}
            description={assessment.description}
            actions={
              <Badge
                tone={
                  assessment.passed
                    ? "success"
                    : assessment.isUnlocked
                      ? "brand"
                      : "neutral"
                }
                dot
              >
                {assessment.passed
                  ? "Passed"
                  : assessment.isUnlocked
                    ? "Available"
                    : "Locked"}
              </Badge>
            }
          />

          <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-mist-500">
            <span className="inline-flex items-center gap-1.5">
              <ListChecks size={14} aria-hidden="true" />
              {assessment.questions.length} questions
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} aria-hidden="true" />
              Pass mark {assessment.passingScore}%
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={14} aria-hidden="true" />
              {assessment.maxAttempts
                ? `${assessment.maxAttempts} attempts`
                : "Unlimited attempts"}
            </span>
            <Link
              to={`/student/courses/${assessment.course.id}`}
              className="text-brand-300 underline-offset-4 hover:underline"
            >
              {assessment.course.title}
            </Link>
          </div>

          {actionError && !showQuiz && !result ? (
            <Alert tone="danger" title="Action failed" className="mb-5">
              {actionError}
            </Alert>
          ) : null}

          {result ? (
            <ResultView
              assessment={assessment}
              result={result}
              onReview={
                latestAttemptId &&
                latestAttemptId !== result.attempt.id &&
                !result.assessment.canRetake
                  ? () => handleReviewAttempt(latestAttemptId)
                  : null
              }
              onRetake={handleStart}
              retakeLoading={starting}
            />
          ) : showQuiz ? (
            <QuizView
              assessment={assessment}
              answers={answers}
              onSelect={handleSelect}
              onSubmit={handleSubmit}
              submitting={submitting}
              actionError={actionError}
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.8fr)]">
              <Card>
                <CardHeader
                  title="Before you start"
                  description="The server grades every attempt and enforces the unlock rules."
                />
                <CardContent className="space-y-4">
                  {!assessment.isUnlocked ? (
                    <Alert tone="warning" title="This assessment is locked">
                      Complete every lesson in week{" "}
                      {assessment.module.weekNumber - 1} to unlock it. Open the{" "}
                      <Link
                        to={`/student/courses/${assessment.course.id}`}
                        className="font-semibold underline underline-offset-2"
                      >
                        course
                      </Link>{" "}
                      to continue.
                    </Alert>
                  ) : assessment.passed ? (
                    <Alert tone="success" title="You have passed this assessment">
                      Your best score is {assessment.bestScore}%. You can review
                      submitted attempts below.
                    </Alert>
                  ) : (
                    <Alert tone="info" title="Ready when you are">
                      You can start, leave and resume an attempt. It is only
                      graded when you submit it, and each submission uses one
                      attempt.
                    </Alert>
                  )}

                  {assessment.questions.length === 0 ? (
                    <p className="text-sm text-mist-400">
                      This assessment does not have any questions yet.
                    </p>
                  ) : null}

                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-ink-800 bg-ink-950/30 p-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                        Attempts used
                      </dt>
                      <dd className="mt-1 text-sm text-mist-100">
                        {assessment.attemptsUsed}
                        {assessment.maxAttempts
                          ? ` of ${assessment.maxAttempts}`
                          : " (unlimited)"}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-ink-800 bg-ink-950/30 p-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                        Best score
                      </dt>
                      <dd className="mt-1 text-sm text-mist-100">
                        {assessment.bestScore !== null
                          ? `${assessment.bestScore}%`
                          : "No attempts yet"}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      icon={Play}
                      loading={starting}
                      disabled={
                        !assessment.canAttempt ||
                        assessment.questions.length === 0
                      }
                      onClick={handleStart}
                    >
                      {assessment.attemptsUsed > 0 ? "Retake assessment" : "Start assessment"}
                    </Button>
                    {!assessment.canAttempt && !assessment.passed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-mist-500">
                        <Lock size={13} aria-hidden="true" />
                        {assessment.isUnlocked
                          ? "No attempts remaining."
                          : "Unlock this week first."}
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title="Attempt history"
                  description="Submitted attempts only"
                />
                <CardContent>
                  {assessment.attempts.length ? (
                    <ul className="space-y-2">
                      {assessment.attempts.map((attempt) => (
                        <li
                          key={attempt.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-ink-800 bg-ink-950/30 px-3 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-mist-100">
                              Attempt {attempt.attemptNumber} · {attempt.score}%
                            </p>
                            <p className="mt-0.5 text-[11px] text-mist-500">
                              {formatDateTime(attempt.submittedAt)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge tone={attempt.passed ? "success" : "warning"}>
                              {attempt.passed ? "Passed" : "Failed"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={reviewingAttemptId === attempt.id}
                              onClick={() => handleReviewAttempt(attempt.id)}
                            >
                              Review
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-mist-500">
                      No submitted attempts yet.
                    </p>
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
