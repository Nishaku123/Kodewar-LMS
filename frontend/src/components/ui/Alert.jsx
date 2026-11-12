import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "../../utils/cn.js";

const tones = {
  info: {
    wrapper: "border-cyan-400/20 bg-cyan-400/[0.06]",
    icon: "text-cyan-300",
    title: "text-cyan-100",
    body: "text-cyan-200/80",
    Icon: Info,
  },
  success: {
    wrapper: "border-emerald-400/20 bg-emerald-400/[0.06]",
    icon: "text-emerald-300",
    title: "text-emerald-100",
    body: "text-emerald-200/80",
    Icon: CheckCircle2,
  },
  warning: {
    wrapper: "border-amber-300/20 bg-amber-300/[0.06]",
    icon: "text-amber-300",
    title: "text-amber-100",
    body: "text-amber-200/80",
    Icon: AlertTriangle,
  },
  danger: {
    wrapper: "border-rose-400/20 bg-rose-400/[0.06]",
    icon: "text-rose-300",
    title: "text-rose-100",
    body: "text-rose-200/80",
    Icon: XCircle,
  },
};

export default function Alert({
  tone = "info",
  title,
  children,
  onDismiss,
  className,
}) {
  const style = tones[tone] || tones.info;
  const Icon = style.Icon;

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3.5",
        style.wrapper,
        className
      )}
    >
      <Icon
        size={17}
        strokeWidth={1.9}
        className={cn("mt-0.5 shrink-0", style.icon)}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        {title ? (
          <p className={cn("text-sm font-medium", style.title)}>{title}</p>
        ) : null}
        {children ? (
          <div className={cn("text-xs leading-5", style.body, title && "mt-1")}>
            {children}
          </div>
        ) : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className={cn(
            "-mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-white/5",
            style.icon
          )}
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
