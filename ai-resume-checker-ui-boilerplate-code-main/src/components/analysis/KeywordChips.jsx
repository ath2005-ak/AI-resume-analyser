import { Check, X, Target, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function Chip({ children, tone }) {
  if (tone === "present") {
    return (
      <span className="inline-flex items-center gap-1.5 h-7 pl-1.5 pr-3 rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] text-[12px] font-semibold transition-transform hover:-translate-y-px">
        <span className="h-4 w-4 rounded-full bg-[var(--accent-strong)] text-white flex items-center justify-center">
          <Check size={9} strokeWidth={3.5} />
        </span>
        {children}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 h-7 pl-1.5 pr-3 rounded-full bg-[#F8E3E0]/70 text-[var(--danger)] text-[12px] font-semibold transition-transform hover:-translate-y-px">
      <span className="h-4 w-4 rounded-full bg-[var(--danger)] text-white flex items-center justify-center">
        <X size={9} strokeWidth={3.5} />
      </span>
      {children}
    </span>
  );
}

function SectionHeader({ tone, label, count, subtitle }) {
  const isPresent = tone === "present";
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2.5">
        <span
          className={
            isPresent
              ? "h-6 w-6 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center"
              : "h-6 w-6 rounded-lg bg-[#F8E3E0] text-[var(--danger)] flex items-center justify-center"
          }
        >
          {isPresent ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
        </span>
        <div className="text-[12px] font-semibold text-[var(--ink)]">{label}</div>
        <span className="text-[11px] text-[var(--ink-muted)] tabular-nums">
          {count}
        </span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>
      {subtitle && (
        <p className="text-[11px] text-[var(--ink-muted)] mt-1 pl-8.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function KeywordChips({ present = [], missing = [], jobDescription, jdMatch }) {
  const total = present.length + missing.length;
  const pct = jdMatch?.matchRate ?? (total ? Math.round((present.length / total) * 100) : 0);
  const hasJobDescription = !!(jobDescription && jobDescription.trim());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle className="text-base">
              {hasJobDescription ? "Job-Description Keyword Match" : "Keywords"}
            </CardTitle>
            <CardDescription className="mt-1">
              {hasJobDescription
                ? "Keyword alignment against your pasted job description"
                : "What ATS sees vs what standard industry roles expect"}
            </CardDescription>
          </div>
          {hasJobDescription && (
            <Badge tone="accent" className="flex items-center gap-1">
              <Target size={11} /> JD Matched
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Match-rate hero banner */}
      <div
        className="relative rounded-2xl border border-[var(--border)] p-5 mb-5 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-soft) 0%, var(--surface-2) 70%, var(--surface) 100%)",
        }}
      >
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ink-muted)]">
              {hasJobDescription ? "JD Keyword Match Rate" : "Role Match Rate"}
            </div>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span
                className="font-display tabular-nums text-[44px] font-semibold leading-none tracking-tight"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #B6CFC0 0%, var(--accent) 45%, var(--accent-strong) 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {present.length}
              </span>
              <span className="text-[var(--ink-muted)] text-base font-medium tabular-nums">
                / {total}
              </span>
              <span className="text-[11px] text-[var(--ink-muted)] ml-1">
                keywords found
              </span>
            </div>
          </div>
          <div className="text-right">
            <div
              className="font-display tabular-nums text-[26px] font-semibold leading-none tracking-tight"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
              }}
            >
              {pct}%
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)] mt-1">
              coverage
            </div>
          </div>
        </div>

        <div className="relative mt-4 h-2 w-full rounded-full bg-[var(--surface)]/70 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background:
                "linear-gradient(90deg, var(--accent) 0%, var(--accent-strong) 100%)",
            }}
          />
        </div>
      </div>

      {/* Helpful banner for Keyword Gap */}
      {hasJobDescription && missing.length > 0 && (
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <Info size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Keyword Gap Alert:</span> The ATS scanner detected that your resume is missing {missing.length} requirements requested in the posting. Adding these to your skills section or work accomplishments will boost your interview match rate.
          </div>
        </div>
      )}

      {/* Present Keywords */}
      <div className="space-y-6">
        <div>
          <SectionHeader
            tone="present"
            label="Matched Skills"
            count={present.length}
            subtitle="Skills and keywords found in your resume that match the role requirements"
          />
          {present.length ? (
            <div className="flex flex-wrap gap-1.5">
              {present.map((k) => (
                <Chip key={k} tone="present">
                  {k}
                </Chip>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--ink-muted)] pl-8">No matching keywords detected.</p>
          )}
        </div>

        {/* Missing Keywords (The Keyword Gap) */}
        <div>
          <SectionHeader
            tone="missing"
            label="Keyword Gap"
            count={missing.length}
            subtitle="Important job posting keywords that were not found on your resume"
          />
          {missing.length ? (
            <div className="flex flex-wrap gap-1.5">
              {missing.map((k) => (
                <Chip key={k} tone="missing">
                  {k}
                </Chip>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--ink-muted)] pl-8">
              No keyword gaps detected! You match all expected requirements.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
