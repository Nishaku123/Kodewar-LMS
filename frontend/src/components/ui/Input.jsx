import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../utils/cn.js";

/**
 * Accessible text input with an optional icon, hint, error message and a
 * working show/hide toggle for passwords.
 */
export default function Input({
  label,
  hint,
  error,
  icon: Icon,
  id,
  type = "text",
  required = false,
  className,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && passwordVisible ? "text" : type;

  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-medium text-mist-300"
        >
          {label}
          {required ? (
            <span className="ml-1 text-brand-300" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className="relative">
        {Icon ? (
          <Icon
            size={16}
            strokeWidth={1.75}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-500"
            aria-hidden="true"
          />
        ) : null}

        <input
          id={inputId}
          type={inputType}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-10 w-full rounded-lg border bg-ink-950/60 px-3 text-sm text-white outline-none transition-colors duration-200 placeholder:text-mist-500",
            "focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20",
            Icon && "pl-9",
            isPassword && "pr-10",
            error
              ? "border-rose-400/60 focus:border-rose-400 focus:ring-rose-500/20"
              : "border-ink-700 hover:border-ink-600"
          )}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-mist-500 transition-colors hover:bg-ink-800 hover:text-mist-200"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible}
          >
            {passwordVisible ? (
              <EyeOff size={15} aria-hidden="true" />
            ) : (
              <Eye size={15} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      {hint && !error ? (
        <p id={hintId} className="mt-1.5 text-xs text-mist-500">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
