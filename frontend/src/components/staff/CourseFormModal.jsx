import { useEffect, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";
import Select from "../ui/Select.jsx";
import {
  createManagedCourseRequest,
  updateManagedCourseRequest,
} from "../../services/manage.js";
import { useToast } from "../../context/ToastContext.jsx";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

function emptyForm() {
  return {
    title: "",
    description: "",
    category: "General",
    level: "Beginner",
    durationMinutes: 0,
    thumbnailUrl: "",
    slug: "",
  };
}

function formFromCourse(course) {
  return {
    title: course.title || "",
    description: course.description || "",
    category: course.category || "General",
    level: course.level || "Beginner",
    durationMinutes: course.durationMinutes ?? 0,
    thumbnailUrl: course.thumbnailUrl || "",
    slug: course.slug || "",
  };
}

/**
 * Create/edit form shared by the course list and course editor.
 */
export default function CourseFormModal({ open, course, onClose, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(course);

  useEffect(() => {
    if (!open) return;
    setForm(course ? formFromCourse(course) : emptyForm());
    setError("");
  }, [open, course]);

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
      category: form.category,
      level: form.level,
      durationMinutes: Number(form.durationMinutes) || 0,
      thumbnailUrl: form.thumbnailUrl || null,
      slug: form.slug || null,
    };

    try {
      const response = isEditing
        ? await updateManagedCourseRequest(course.id, payload)
        : await createManagedCourseRequest(payload);
      const saved = response.data.course;

      toast({
        tone: "success",
        title: isEditing ? "Course updated" : "Course created",
        description: saved.title,
      });
      onSaved?.(saved);
      onClose();
    } catch (requestError) {
      setError(requestError.message || "Could not save the course.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit course" : "Create course"}
      description={
        isEditing
          ? "Changes are visible to students as soon as the course is published."
          : "New courses start as drafts. Add modules and lessons, then publish."
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="course-form" loading={saving}>
            {isEditing ? "Save changes" : "Create course"}
          </Button>
        </>
      }
    >
      <form id="course-form" className="space-y-4" onSubmit={handleSubmit}>
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
          placeholder="e.g. JavaScript Foundations"
          maxLength={180}
        />

        <Textarea
          label="Description"
          rows={4}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="What will students learn in this course?"
          maxLength={5000}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Category"
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
            placeholder="Web Development"
            maxLength={80}
          />
          <Select
            label="Level"
            value={form.level}
            onChange={(event) => update("level", event.target.value)}
            options={LEVELS.map((level) => ({ value: level, label: level }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Duration (minutes)"
            type="number"
            min={0}
            max={100000}
            value={form.durationMinutes}
            onChange={(event) => update("durationMinutes", event.target.value)}
          />
          <Input
            label="Thumbnail URL"
            type="url"
            value={form.thumbnailUrl}
            onChange={(event) => update("thumbnailUrl", event.target.value)}
            placeholder="https://..."
            hint="Optional. Must use https://."
          />
        </div>

        {form.thumbnailUrl ? (
          <div className="overflow-hidden rounded-lg border border-ink-700 bg-ink-950/40">
            <img
              src={form.thumbnailUrl}
              alt="Course thumbnail preview"
              className="h-36 w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <p className="px-3 py-2 text-[11px] text-mist-500">
              Thumbnail preview. Students see this image on their course cards.
            </p>
          </div>
        ) : null}

        <Input
          label="Slug"
          value={form.slug}
          onChange={(event) => update("slug", event.target.value)}
          placeholder="javascript-foundations"
          hint="Optional. Generated from the title when left blank."
          maxLength={120}
        />
      </form>
    </Modal>
  );
}
