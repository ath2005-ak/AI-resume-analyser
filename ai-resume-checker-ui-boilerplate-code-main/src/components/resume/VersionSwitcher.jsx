import { cn } from "@/lib/utils";

export function VersionSwitcher({ versions, activeId, onChange }) {
  if (!versions?.length) return null;
  return (
    <div
      role="tablist"
      aria-label="Resume version selector"
      className="inline-flex items-center gap-1 bg-[var(--surface-2)] border border-[var(--border)] p-1 rounded-full"
    >
      {versions.map((v) => {
        const isActive = activeId === v._id;
        return (
          <button
            key={v._id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Switch to ${v.label}`}
            onClick={() => onChange(v._id)}
            className={cn(
              "h-8 px-3 text-xs font-medium rounded-full transition-colors tabular focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
              isActive
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-card"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
