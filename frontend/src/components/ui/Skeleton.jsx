import { cn } from "../../utils/cn.js";

export default function Skeleton({ className }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-ink-800", className)}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            "h-2.5",
            index === lines - 1 ? "w-2/3" : index % 2 === 0 ? "w-full" : "w-5/6"
          )}
        />
      ))}
    </div>
  );
}
