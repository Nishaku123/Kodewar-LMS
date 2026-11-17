/**
 * Consistent page heading used inside the dashboard layout.
 * Shows an optional small eyebrow, a title, a description and actions.
 */
export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">
            <span className="h-px w-8 bg-brand-500" aria-hidden="true" />
            {eyebrow}
          </p>
        ) : null}

        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mist-400">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
