import { useId } from "react";
import { cn } from "../../utils/cn.js";

export default function Textarea({
  label,
  hint,
  error,
  id,
  rows = 4,
  className,
  ...props
}) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const describedBy =
    [hint ? `${textareaId}-hint` : null, error ? `${textareaId}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label
          htmlFor={textareaId}
          className="mb-1.5 block text-xs font-medium text-mist-300"
        >
          {label}
        </label>
      ) : null}

      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full resize-y rounded-lg border bg-ink-950/60 px-3 py-2.5 text-sm leading-6 text-white outline-none transition-colors duration-200 placeholder:text-mist-500",
          "focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20",
          error
            ? "border-rose-400/60 focus:border-rose-400 focus:ring-rose-500/20"
            : "border-ink-700 hover:border-ink-600"
        )}
        {...props}
      />

      {(hint && !error) || error ? (
        <div className="mt-1.5">
          {hint && !error ? (
            <p id={`${textareaId}-hint`} className="text-xs text-mist-500">
              {hint}
            </p>
          ) : null}
          {error ? (
            <p
              id={`${textareaId}-error`}
              className="text-xs text-rose-300"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : null}    </div>
  );
}
