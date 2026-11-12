import { cn } from "../../utils/cn.js";

const sizes = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function Avatar({ name, src, size = "md", className }) {
  const sizeClass = sizes[size] || sizes.md;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink-600 bg-gradient-to-br from-brand-500/30 to-cyan-500/20 font-semibold text-brand-300",
        sizeClass,
        className
      )}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span aria-hidden="true">{getInitials(name || "?")}</span>
      )}
      {!src ? <span className="sr-only">{name}</span> : null}
    </span>
  );
}
