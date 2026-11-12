import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";
import {
  createModuleRequest,
  updateModuleRequest,
} from "../../services/manage.js";
import { useToast } from "../../context/ToastContext.jsx";

function initialForm(module) {
  return {
    title: module?.title || "",
    description: module?.description || "",
    weekNumber: module?.weekNumber ?? 1,
    position: module?.position ?? "",
  };
}

export default function ModuleFormModal({
  open,
  courseId,
  module,
  nextWeek = 1,
  onClose,
  onSaved,
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(() => initialForm(module));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(module);

  useEffect(() => {
    if (!open) return;
    setForm(module ? initialForm(module) : { ...initialForm(null), weekNumber: nextWeek });
    setError("");
  }, [open, module, nextWeek]);

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
      weekNumber: Number(form.weekNumber),
    };

    if (form.position !== "") {
      payload.position = Number(form.position);
    }

    try {
      const response = isEditing
        ? await updateModuleRequest(module.id, payload)
        : await createModuleRequest(courseId, payload);

      toast({
        tone: "success",
        title: isEditing ? "Module updated" : "Module created",
        description: `Week ${payload.weekNumber}`,
      });
      onSaved?.(response.data.module);
      onClose();
    } catch (requestError) {
      setError(requestError.message || "Could not save the module.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit module" : "New module"}
      description="Modules are the weekly sections of a course. Week numbers must be unique."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="module-form" loading={saving}>
            {isEditing ? "Save changes" : "Create module"}
          </Button>
        </>
      }
    >
      <form id="module-form" className="space-y-4" onSubmit={handleSubmit}>
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
          placeholder="Week 1 — JavaScript foundations"
          maxLength={180}
        />

        <Textarea
          label="Description"
          rows={3}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="What does this week cover?"
          maxLength={5000}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Week number"
            type="number"
            min={1}
            max={520}
            required
            value={form.weekNumber}
            onChange={(event) => update("weekNumber", event.target.value)}
          />
          <Input
            label="Position"
            type="number"
            min={1}
            max={1000}
            value={form.position}
            onChange={(event) => update("position", event.target.value)}
            hint="Optional. Defaults to the next free position."
          />
        </div>
      </form>
    </Modal>
  );
}
