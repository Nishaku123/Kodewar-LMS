import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";
import {
  createAssignmentRequest,
  updateAssignmentRequest,
} from "../../services/manage.js";
import { useToast } from "../../context/ToastContext.jsx";

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function initialForm(assignment) {
  return {
    title: assignment?.title || "",
    description: assignment?.description || "",
    instructions: assignment?.instructions || "",
    dueAt: toLocalDateTime(assignment?.dueAt),
    maxPoints: assignment?.maxPoints ?? 100,
  };
}

export default function AssignmentFormModal({
  open,
  moduleId,
  assignment,
  onClose,
  onSaved,
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(() => initialForm(assignment));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(assignment);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(assignment));
    setError("");
  }, [open, assignment]);

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
      instructions: form.instructions,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      maxPoints: Number(form.maxPoints),
    };

    try {
      const response = isEditing
        ? await updateAssignmentRequest(assignment.id, payload)
        : await createAssignmentRequest(moduleId, payload);

      toast({
        tone: "success",
        title: isEditing ? "Assignment updated" : "Assignment draft created",
        description: payload.title,
      });
      onSaved?.(response.data.assignment);
      onClose();
    } catch (requestError) {
      setError(requestError.message || "Could not save the assignment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit assignment" : "New assignment"}
      description="New assignments start as drafts. Publish when students should be able to submit."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="assignment-form" loading={saving}>
            {isEditing ? "Save changes" : "Create draft"}
          </Button>
        </>
      }
    >
      <form id="assignment-form" className="space-y-4" onSubmit={handleSubmit}>
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
          placeholder="Build a small to-do list"
          maxLength={180}
        />

        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Short summary shown in assignment lists."
          maxLength={5000}
        />

        <Textarea
          label="Instructions"
          rows={5}
          value={form.instructions}
          onChange={(event) => update("instructions", event.target.value)}
          placeholder="Explain exactly what students should do and submit."
          maxLength={5000}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Due date"
            type="datetime-local"
            value={form.dueAt}
            onChange={(event) => update("dueAt", event.target.value)}
            hint="Optional."
          />
          <Input
            label="Maximum points"
            type="number"
            min={1}
            max={10000}
            required
            value={form.maxPoints}
            onChange={(event) => update("maxPoints", event.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
