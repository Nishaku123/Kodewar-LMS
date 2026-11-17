import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn.js";

/**
 * Native select element styled to match the rest of the form controls.
 * Native selects are easier to use on mobile and with screen readers.
 */
export default function Select({
  label,
  hint,
  error,
  id,
  options = [],
  placeholder,
  className,
  children,
  ...props
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const describedBy =
    [hint ? `${selectId}-hint` : null, error ? `${selectId}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-xs font-medium text-mist-300"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-10 w-full appearance-none rounded-lg border bg-ink-950/60 px-3 pr-9 text-sm text-white outline-none transition-colors duration-200",
            "focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20",
            error
              ? "border-rose-400/60 focus:border-rose-400 focus:ring-rose-500/20"
              : "border-ink-700 hover:border-ink-600"
          )}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>

        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-mist-500"
          aria-hidden="true"
        />
      </div>

      {hint && !error ? (
        <p id={`${selectId}-hint`} className="mt-1.5 text-xs text-mist-500">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={`${selectId}-error`}
          className="mt-1.5 text-xs text-rose-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
