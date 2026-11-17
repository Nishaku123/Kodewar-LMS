import { cn } from "../../utils/cn.js";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-ink-700 bg-ink-900/30 px-6 py-10 text-center",
        className
      )}
    >
      {Icon ? (
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink-700 bg-ink-900 text-brand-300">
          <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
      ) : null}

      <h3 className="mt-4 font-display text-base font-medium text-white">
        {title}
      </h3>

      {description ? (
        <p className="mt-1.5 max-w-sm text-xs leading-5 text-mist-500">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
