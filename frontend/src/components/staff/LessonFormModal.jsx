import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";
import Select from "../ui/Select.jsx";
import {
  createLessonRequest,
  updateLessonRequest,
} from "../../services/manage.js";
import { useToast } from "../../context/ToastContext.jsx";

const PROVIDERS = [
  { value: "", label: "No video" },
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "direct", label: "Direct video URL" },
];

function initialForm(lesson) {
  return {
    title: lesson?.title || "",
    description: lesson?.description || "",
    durationMinutes: lesson?.durationMinutes ?? 0,
    position: lesson?.position ?? "",
    videoProvider: lesson?.videoProvider || "",
    videoUrl: lesson?.videoUrl || "",
  };
}

export default function LessonFormModal({
  open,
  moduleId,
  lesson,
  onClose,
  onSaved,
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(() => initialForm(lesson));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(lesson);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(lesson));
    setError("");
  }, [open, lesson]);

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
      durationMinutes: Number(form.durationMinutes) || 0,
      videoProvider: form.videoProvider || null,
      videoUrl: form.videoProvider ? form.videoUrl || null : null,
    };

    if (form.position !== "") {
      payload.position = Number(form.position);
    }

    try {
      const response = isEditing
        ? await updateLessonRequest(lesson.id, payload)
        : await createLessonRequest(moduleId, payload);

      toast({
        tone: "success",
        title: isEditing ? "Lesson updated" : "Lesson created",
        description: payload.title,
      });
      onSaved?.(response.data.lesson);
      onClose();
    } catch (requestError) {
      setError(requestError.message || "Could not save the lesson.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit lesson" : "New lesson"}
      description="Add the lesson text and an optional video. Students unlock lessons in module order."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="lesson-form" loading={saving}>
            {isEditing ? "Save changes" : "Create lesson"}
          </Button>
        </>
      }
    >
      <form id="lesson-form" className="space-y-4" onSubmit={handleSubmit}>
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
          placeholder="Variables and scope"
          maxLength={180}
        />

        <Textarea
          label="Description"
          rows={3}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="What will students learn in this lesson?"
          maxLength={5000}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Duration (minutes)"
            type="number"
            min={0}
            max={10000}
            value={form.durationMinutes}
            onChange={(event) => update("durationMinutes", event.target.value)}
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

        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <Select
            label="Video provider"
            value={form.videoProvider}
            onChange={(event) => update("videoProvider", event.target.value)}
            options={PROVIDERS}
          />
          <Input
            label="Video URL"
            type="url"
            value={form.videoUrl}
            onChange={(event) => update("videoUrl", event.target.value)}
            placeholder="https://..."
            disabled={!form.videoProvider}
            hint={
              form.videoProvider
                ? "Required for the selected provider."
                : "Choose a provider to attach a video."
            }
          />
        </div>
      </form>
    </Modal>
  );
}
