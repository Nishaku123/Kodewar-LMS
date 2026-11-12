import { cn } from "../../utils/cn.js";

const tones = {
  brand: "border-brand-500/20 bg-brand-500/10 text-brand-300",
  cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-300/20 bg-amber-300/10 text-amber-200",
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "brand",
  className,
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-700/70 bg-ink-900/60 p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-mist-400">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border",
              tones[tone] || tones.brand
            )}
          >
            <Icon size={15} strokeWidth={1.85} aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>

      {hint ? <p className="mt-1 text-[11px] text-mist-500">{hint}</p> : null}
    </div>
  );
}
