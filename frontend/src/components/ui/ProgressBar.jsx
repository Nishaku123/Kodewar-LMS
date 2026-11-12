import { cn } from "../../utils/cn.js";

const heights = {
  sm: "h-1.5",
  md: "h-2",
};

const tones = {
  brand: "bg-gradient-to-r from-brand-500 to-cyan-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
};

export default function ProgressBar({
  value = 0,
  label,
  showValue = true,
  size = "md",
  tone = "brand",
  className,
}) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className={cn("w-full", className)}>
      {label || showValue ? (
        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
          {label ? <span className="text-mist-400">{label}</span> : <span />}
          {showValue ? (
            <span className="font-medium text-mist-200">
              {Math.round(safeValue)}%
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-ink-800",
          heights[size] || heights.md
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(safeValue)}
        aria-label={label || "Progress"}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            tones[tone] || tones.brand
          )}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
