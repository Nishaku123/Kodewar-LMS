import { useId } from "react";
import { cn } from "../../utils/cn.js";

export default function Checkbox({
  label,
  description,
  id,
  className,
  ...props
}) {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        "flex cursor-pointer items-start gap-3 text-sm text-mist-200",
        className
      )}
    >
      <input
        id={checkboxId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-ink-600 bg-ink-900 accent-brand-500"
        {...props}
      />
      <span>
        <span className="block font-medium text-mist-200">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-5 text-mist-500">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
