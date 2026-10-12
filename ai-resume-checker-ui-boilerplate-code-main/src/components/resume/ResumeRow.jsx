import { useNavigate } from "react-router-dom";
import { FileText, ChevronRight, Trash2, Layers } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { relativeTime } from "@/lib/utils";
import { useDeleteResume } from "@/hooks/useResumes";

export function ResumeRow({ resume }) {
  const nav = useNavigate();
  const del = useDeleteResume();

  function openResume() {
    nav(`/resumes/${resume._id}`);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openResume();
    }
  }

  async function remove(e) {
    e.stopPropagation();
    if (!confirm("Delete this resume and all its versions?")) return;
    await del.mutateAsync(resume._id);
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`View analysis and versions for resume: ${resume.title}`}
      onClick={openResume}
      onKeyDown={handleKeyDown}
      className="cursor-pointer flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <div
        className="h-12 w-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        <FileText size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-display text-base font-semibold truncate text-[var(--ink)]">
          {resume.title}
        </div>
        <div className="text-xs text-[var(--ink-muted)] mt-0.5">
          Updated {relativeTime(resume.updatedAt)}
        </div>
      </div>

      <Badge tone="neutral" className="gap-1" aria-label={`${resume.latestVersionNumber || 1} versions`}>
        <Layers size={11} aria-hidden="true" />
        {resume.latestVersionNumber || 1} version{(resume.latestVersionNumber || 1) > 1 ? "s" : ""}
      </Badge>

      <button
        type="button"
        onClick={remove}
        disabled={del.isPending}
        className="h-9 w-9 rounded-full hover:bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--danger)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        aria-label={`Delete resume ${resume.title}`}
        title="Delete"
      >
        <Trash2 size={15} />
      </button>

      <ChevronRight size={16} className="text-[var(--ink-muted)]" aria-hidden="true" />
    </Card>
  );
}
