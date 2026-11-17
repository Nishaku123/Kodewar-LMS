import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";
import {
  createAssessmentRequest,
  updateAssessmentRequest,
} from "../../services/manage.js";
import { useToast } from "../../context/ToastContext.jsx";

function initialForm(assessment) {
  return {
    title: assessment?.title || "",
    description: assessment?.description || "",
    passingScore: assessment?.passingScore ?? 60,
    maxAttempts: assessment?.maxAttempts ?? 3,
  };
}

export default function AssessmentFormModal({
  open,
  moduleId,
  assessment,
  onClose,
  onSaved,
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(() => initialForm(assessment));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(assessment);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(assessment));
    setError("");
  }, [open, assessment]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      description: form.description,
      passingScore: Number(form.passingScore),
      maxAttempts: Number(form.maxAttempts),
    };

    try {
      const response = isEditing
        ? await updateAssessmentRequest(assessment.id, payload)
        : await createAssessmentRequest(moduleId, payload);

      toast({
        tone: "success",
        title: isEditing ? "Assessment updated" : "Assessment draft created",
        description: payload.title,
      });
      onSaved?.(response.data.assessment);
      onClose();
    } catch (requestError) {
      setError(requestError.message || "Could not save the assessment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit assessment" : "New assessment"}
      description="Assessments start as drafts. Add questions and options, then publish when they are ready."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="assessment-form" loading={saving}>
            {isEditing ? "Save changes" : "Create draft"}
          </Button>
        </>
      }
    >
      <form id="assessment-form" className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-400/20 bg-rose-400/5 px-3 py-2.5 text-xs text-rose-200"
          >
            {error}
          </div>
        ) : null}

        <Input
          label="Title"
          required
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Week 1 knowledge check"
          maxLength={180}
        />

        <Textarea
          label="Description"
          rows={3}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="What does this assessment cover?"
          maxLength={5000}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Passing score (%)"
            type="number"
            min={0}
            max={100}
            required
            value={form.passingScore}
            onChange={(event) => update("passingScore", event.target.value)}
            hint="Students need at least this percentage to pass."
          />
          <Input
            label="Maximum attempts"
            type="number"
            min={0}
            max={100}
            required
            value={form.maxAttempts}
            onChange={(event) => update("maxAttempts", event.target.value)}
            hint="Use 0 for unlimited attempts."
          />
        </div>
      </form>
    </Modal>
  );
}
