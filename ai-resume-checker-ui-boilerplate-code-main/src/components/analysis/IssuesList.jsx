import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, AlertTriangle, Info, ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const SEV_CONFIG = {
  high: { tone: "danger", label: "High Impact", icon: AlertCircle },
  medium: { tone: "warning", label: "Medium Impact", icon: AlertTriangle },
  low: { tone: "neutral", label: "Low Impact", icon: Info },
};

function IssueItem({ issue, index }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const sevKey = (issue.severity || "low").toLowerCase();
  const sev = SEV_CONFIG[sevKey] || SEV_CONFIG.low;
  const SevIcon = sev.icon;

  return (
    <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface-2)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        aria-label={`${issue.title || "Issue"}, severity ${sev.label}`}
        className="w-full text-left p-4 hover:bg-[var(--surface-2)]/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <div className="flex items-start gap-3">
          <div
            className="h-8 w-8 rounded-xl bg-[var(--surface)] flex items-center justify-center shrink-0 text-[var(--ink-muted)]"
            aria-hidden="true"
          >
            <AlertCircle size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-sm text-[var(--ink)]">{issue.title}</div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  tone={sev.tone}
                  className="gap-1 inline-flex items-center"
                  role="status"
                  aria-label={`Severity: ${sev.label}`}
                >
                  <SevIcon size={11} aria-hidden="true" />
                  <span>{sev.label}</span>
                </Badge>
                <ChevronDown
                  size={14}
                  className={cn(
                    "text-[var(--ink-muted)] transition-transform duration-200",
                    open && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </div>
            </div>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={contentId}
                  role="region"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {issue.explanation && (
                    <div className="text-xs text-[var(--ink-muted)] mt-2 leading-relaxed">
                      {issue.explanation}
                    </div>
                  )}
                  {issue.fix && (
                    <div className="mt-2 text-xs rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)] px-3 py-2 leading-relaxed">
                      <strong className="font-semibold">Recommended Fix:</strong> {issue.fix}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </button>
    </div>
  );
}

export function IssuesList({ issues = [] }) {
  const safeIssues = Array.isArray(issues) ? issues : [];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base">Top Issues</CardTitle>
          <CardDescription className="mt-1">
            What to fix first, ranked by impact
          </CardDescription>
        </div>
        <Badge tone="neutral" aria-label={`${safeIssues.length} total issues`}>
          {safeIssues.length}
        </Badge>
      </CardHeader>
      <div className="space-y-2">
        {safeIssues.length === 0 ? (
          <div className="text-xs text-[var(--ink-muted)] p-4 text-center">
            No issues detected. Great job!
          </div>
        ) : (
          safeIssues.map((issue, i) => (
            <IssueItem key={issue._id || i} issue={issue} index={i} />
          ))
        )}
      </div>
    </Card>
  );
}
