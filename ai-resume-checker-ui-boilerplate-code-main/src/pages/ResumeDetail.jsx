import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  FileText,
  Download,
  AlertTriangle,
  Check,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { AtsGauge } from "@/components/dashboard/AtsGauge";
import { ScoreBreakdown } from "@/components/analysis/ScoreBreakdown";
import { IssuesList } from "@/components/analysis/IssuesList";
import { StrengthsList } from "@/components/analysis/StrengthsList";
import { KeywordChips } from "@/components/analysis/KeywordChips";
import { BulletRewrites } from "@/components/analysis/BulletRewrites";
import { VersionSwitcher } from "@/components/resume/VersionSwitcher";
import { DiffView } from "@/components/resume/DiffView";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { relativeTime } from "@/lib/utils";
import {
  useResume,
  useAnalysisForVersion,
  useAnalyzeResume,
  useApplyRewrites,
} from "@/hooks/useResumes";

/**
 * Animated progress indicator giving clear multi-step feedback during analysis.
 * Steps: Parsing -> Scoring -> Matching -> Writing suggestions
 */
function AnalysisProgressFeedback({ hasJobDescription = false }) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = useMemo(
    () => [
      {
        title: "Parsing structure",
        desc: "Extracting contact details, sections & experience entries",
      },
      {
        title: "Deterministic scoring",
        desc: "Running ATS baseline checks on format, contact, metrics & dates",
      },
      {
        title: hasJobDescription ? "Matching job posting" : "Analyzing role alignment",
        desc: hasJobDescription
          ? "Extracting requirements & calculating keyword gap"
          : "Benchmarking against industry standards",
      },
      {
        title: "Writing suggestions",
        desc: "Synthesizing quantified bullet rewrites & actionable fixes",
      },
    ],
    [hasJobDescription]
  );

  useEffect(() => {
    const t1 = setTimeout(() => setActiveStep(1), 1800);
    const t2 = setTimeout(() => setActiveStep(2), 3800);
    const t3 = setTimeout(() => setActiveStep(3), 5800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const progressPct = Math.round(((activeStep + 1) / steps.length) * 100);

  return (
    <Card className="border-[var(--accent)]/40 bg-[var(--surface)] shadow-md overflow-hidden animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="font-semibold text-base text-[var(--ink)]">
              Analyzing Resume Version
            </div>
            <div className="text-xs text-[var(--ink-muted)]">
              Step {activeStep + 1} of {steps.length}: {steps[activeStep].title}
            </div>
          </div>
        </div>
        <Badge tone="accent" className="animate-pulse">
          In progress…
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 mb-5">
        <div className="h-2 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((st, i) => {
          const isDone = i < activeStep;
          const isCurrent = i === activeStep;
          return (
            <div
              key={i}
              className={`p-3 rounded-2xl border transition-all ${
                isCurrent
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]/50 ring-1 ring-[var(--accent)] shadow-sm"
                  : isDone
                  ? "border-[var(--border)] bg-[var(--surface-2)]/60 opacity-80"
                  : "border-[var(--border)] bg-[var(--surface)] opacity-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                    isDone
                      ? "bg-[var(--accent)] text-white"
                      : isCurrent
                      ? "bg-[var(--accent-strong)] text-white animate-pulse"
                      : "bg-[var(--border)] text-[var(--ink-muted)]"
                  }`}
                >
                  {isDone ? <Check size={11} strokeWidth={3} /> : i + 1}
                </span>
                <span className="font-semibold text-xs text-[var(--ink)] truncate">
                  {st.title}
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] leading-tight mt-1 pl-7">
                {st.desc}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function ResumeDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const { data, isLoading, error } = useResume(id);
  const resume = data?.resume;
  const versions = data?.versions || [];

  const [activeVersionId, setActiveVersionId] = useState(null);
  useEffect(() => {
    if (!activeVersionId && versions.length) {
      setActiveVersionId(resume?.currentVersionId || versions[versions.length - 1]._id);
    }
  }, [versions, resume, activeVersionId]);

  const activeVersion = useMemo(
    () => versions.find((v) => v._id === activeVersionId),
    [versions, activeVersionId]
  );

  const analysisQuery = useAnalysisForVersion(id, activeVersionId);
  const analysis = analysisQuery.data;

  const analyze = useAnalyzeResume(id);
  const applyRewrites = useApplyRewrites(id);
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showJdInput, setShowJdInput] = useState(false);
  const [tab, setTab] = useState("score");

  async function runAnalyze() {
    try {
      await analyze.mutateAsync({
        versionId: activeVersionId,
        targetRole: targetRole.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      });
    } catch {
      /* surfaced below */
    }
  }

  async function runApplyRewrites(rewriteIds) {
    if (!analysis?._id) return;
    try {
      const res = await applyRewrites.mutateAsync({
        analysisId: analysis._id,
        rewriteIds: rewriteIds.length ? rewriteIds : undefined,
      });
      if (res?.version?._id) {
        const newVersionId = res.version._id;
        setActiveVersionId(newVersionId);
        setTab("score");
        try {
          await analyze.mutateAsync({
            versionId: newVersionId,
            targetRole: targetRole.trim() || undefined,
            jobDescription: jobDescription.trim() || undefined,
          });
        } catch {
          /* surfaced via analyze.error inside the Run analysis card */
        }
      }
    } catch {
      /* surfaced inside the card */
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3 rounded-2xl" />
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={FileText}
        title="Resume not found"
        description={error.message}
        action={
          <Button variant="outline" onClick={() => nav("/resumes")}>
            Back to resumes
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={resume?.title || "Resume"}
        description={
          resume
            ? `Updated ${relativeTime(resume.updatedAt)} · ${versions.length} version${
                versions.length > 1 ? "s" : ""
              }`
            : ""
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => nav("/resumes")}>
              <ArrowLeft size={14} /> All resumes
            </Button>
            <Button
              variant="outline"
              onClick={() => nav(`/resumes/${id}/export`)}
            >
              <Download size={14} /> Export
            </Button>
          </div>
        }
      />

      {/* Analysis Control Card */}
      <Card>
        <div className="flex flex-wrap items-end gap-4 justify-between">
          <div className="space-y-2">
            <CardTitle className="text-base">Run analysis</CardTitle>
            <CardDescription>
              Score this version with stable deterministic checks and Gemini AI to uncover keyword gaps.
            </CardDescription>
            <VersionSwitcher
              versions={versions}
              activeId={activeVersionId}
              onChange={setActiveVersionId}
            />
          </div>

          <div className="flex items-center gap-2.5 flex-1 min-w-[280px] max-w-[560px]">
            <Input
              placeholder="Target role (optional, e.g. Senior Frontend Engineer)"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowJdInput((prev) => !prev)}
              className={`shrink-0 gap-1.5 text-xs ${
                showJdInput || jobDescription.trim() ? "border-[var(--accent)] text-[var(--accent-strong)]" : ""
              }`}
            >
              <Target size={13} />
              {showJdInput || jobDescription.trim() ? "Hide Job Posting" : "Paste Job Posting"}
              {showJdInput || jobDescription.trim() ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </Button>
            <Button
              variant="accent"
              size="md"
              onClick={runAnalyze}
              disabled={analyze.isPending || !activeVersionId}
              className="shrink-0 gap-1.5"
            >
              {analyze.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Analyze
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Collapsible Job Description Input */}
        {(showJdInput || jobDescription.trim()) && (
          <div className="mt-4 pt-4 border-t border-[var(--border)] animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <Target size={14} className="text-[var(--accent)]" /> Target Job Posting (Job-Description Matching)
              </label>
              {jobDescription.trim() && (
                <span className="text-[11px] text-[var(--ink-muted)]">
                  {jobDescription.trim().split(/\s+/).filter(Boolean).length} words pasted
                </span>
              )}
            </div>
            <textarea
              className="w-full p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-y min-h-[95px] font-sans leading-relaxed"
              placeholder="Paste the job description or requirements here... We will extract all key requirements, compare them against your resume, and pinpoint the exact Keyword Gap."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <p className="text-[11px] text-[var(--ink-muted)] mt-1.5">
              Tip: Pasting the job posting enables keyword gap detection, showing you exactly which skills you need to add to pass automated ATS filters.
            </p>
          </div>
        )}

        {analyze.error && (
          <div className="mt-4 text-xs text-[var(--danger)] bg-[#F8E3E0] rounded-xl px-3 py-2">
            {analyze.error.message}
          </div>
        )}
      </Card>

      {/* Progress Feedback during active analysis */}
      {analyze.isPending && (
        <AnalysisProgressFeedback hasJobDescription={!!jobDescription.trim()} />
      )}

      {!analysis && !analysisQuery.isLoading && !analyze.isPending && (
        <EmptyState
          icon={Sparkles}
          title="No analysis yet for this version"
          description="Click Analyze above to score this resume version with AI and evaluate keyword gaps."
        />
      )}

      {analysisQuery.isLoading && !analyze.isPending && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-[280px] rounded-3xl" />
          <Skeleton className="h-[280px] rounded-3xl lg:col-span-2" />
        </div>
      )}

      {analysis && !analyze.isPending && (
        <ErrorBoundary
          title="Unable to display analysis payload"
          description="A section of this analysis payload could not be rendered due to invalid or malformed data. Your resume content and version history are intact."
        >
          {analysis.model?.toLowerCase().includes("basic mode") && (
            <div className="flex items-start gap-3 p-4 mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200" role="status">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
              <div className="text-sm">
                <div className="font-semibold">Basic Mode (AI Unavailable)</div>
                <p className="mt-0.5 text-xs opacity-90 leading-relaxed">
                  The Gemini AI service is currently unavailable or unconfigured. This report was generated using deterministic rule-based ATS scoring and template guidance rather than generative AI.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4">
              <AtsGauge score={analysis.atsScore} delta={0} />
            </div>
            <div className="lg:col-span-5">
              <ScoreBreakdown breakdown={analysis.scoreBreakdown} />
            </div>
            <div className="lg:col-span-3">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div>
                    <CardTitle className="text-base">Verdict</CardTitle>
                    <CardDescription className="mt-1">
                      {analysis.model?.toLowerCase().includes("basic mode")
                        ? "Rule-based evaluation"
                        : "AI overall summary"}
                    </CardDescription>
                  </div>
                  <Badge tone={analysis.model?.toLowerCase().includes("basic mode") ? "warning" : "accent"}>
                    {analysis.model}
                  </Badge>
                </CardHeader>
                <p className="text-sm text-[var(--ink)] leading-relaxed">
                  {analysis.summary}
                </p>
              </Card>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList aria-label="Analysis report sections">
              <TabsTrigger value="score">Issues</TabsTrigger>
              <TabsTrigger value="strengths">Strengths</TabsTrigger>
              <TabsTrigger value="keywords">
                {analysis.jobDescription ? "Keywords (JD Match)" : "Keywords"}
              </TabsTrigger>
              <TabsTrigger value="rewrites">Rewrites</TabsTrigger>
              {versions.length >= 2 && (
                <TabsTrigger value="diff">Diff</TabsTrigger>
              )}
            </TabsList>

            <div className="mt-5">
              <TabsContent value="score">
                <IssuesList issues={analysis.issues || []} />
              </TabsContent>
              <TabsContent value="strengths">
                <StrengthsList strengths={analysis.strengths || []} />
              </TabsContent>
              <TabsContent value="keywords">
                <KeywordChips
                  present={analysis.keywordsPresent || []}
                  missing={analysis.keywordsMissing || []}
                  jobDescription={analysis.jobDescription}
                  jdMatch={analysis.jdMatch}
                />
              </TabsContent>
              <TabsContent value="rewrites">
                <BulletRewrites
                  rewrites={analysis.bulletRewrites || []}
                  onApply={runApplyRewrites}
                  isApplying={applyRewrites.isPending}
                  error={applyRewrites.error?.message}
                />
              </TabsContent>
              <TabsContent value="diff">
                <DiffView resumeId={id} versions={versions} />
              </TabsContent>
            </div>
          </Tabs>
        </ErrorBoundary>
      )}

      {activeVersion && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">Parsed Sections ({activeVersion.label})</CardTitle>
              <CardDescription className="mt-1">
                Quick preview of extracted structured sections
              </CardDescription>
            </div>
          </CardHeader>
          <ParsedSectionsPreview version={activeVersion} />
        </Card>
      )}
    </div>
  );
}

function PreviewLabel({ children }) {
  return (
    <div className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)] mb-1.5">
      {children}
    </div>
  );
}

function ParsedSectionsPreview({ version }) {
  const s = version.parsedSections || {};
  const b = s.basics || {};

  return (
    <div className="space-y-4 text-sm">
      {(b.name || b.title || b.email) && (
        <div className="pb-4 border-b border-[var(--border)]">
          {b.name && (
            <div className="font-display font-semibold text-lg text-[var(--ink)]">
              {b.name}
            </div>
          )}
          {b.title && (
            <div className="text-[var(--accent-strong)] font-medium text-xs mt-0.5">
              {b.title}
            </div>
          )}
          <div className="text-xs text-[var(--ink-muted)] mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {b.email && <span>{b.email}</span>}
            {b.phone && <span>· {b.phone}</span>}
            {b.location && <span>· {b.location}</span>}
          </div>
        </div>
      )}

      {s.summary && (
        <div>
          <PreviewLabel>Summary</PreviewLabel>
          <p className="text-xs text-[var(--ink)] leading-relaxed">{s.summary}</p>
        </div>
      )}

      {s.experience?.length > 0 && (
        <div>
          <PreviewLabel>Experience ({s.experience.length})</PreviewLabel>
          <div className="space-y-2">
            {s.experience.map((e, i) => (
              <div key={i} className="text-xs">
                <div className="font-medium text-[var(--ink)]">
                  {e.role} {e.company && `· ${e.company}`}
                </div>
                {e.period && (
                  <div className="text-[11px] text-[var(--ink-muted)]">{e.period}</div>
                )}
                {e.bullets?.length > 0 && (
                  <ul className="mt-1 space-y-1 list-disc list-inside text-[var(--ink-muted)] text-[11px]">
                    {e.bullets.slice(0, 3).map((b, j) => (
                      <li key={j} className="truncate">
                        {b.replace(/^[-*•]\s*/, "")}
                      </li>
                    ))}
                    {e.bullets.length > 3 && (
                      <li className="text-[10px] italic">
                        +{e.bullets.length - 3} more bullets…
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {s.skills?.length > 0 && (
        <div>
          <PreviewLabel>Skills ({s.skills.length})</PreviewLabel>
          <div className="flex flex-wrap gap-1">
            {s.skills.map((sk, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--ink)]"
              >
                {sk}
              </span>
            ))}
          </div>
        </div>
      )}

      {s.education?.length > 0 && (
        <div>
          <PreviewLabel>Education ({s.education.length})</PreviewLabel>
          <div className="space-y-1 text-xs">
            {s.education.map((ed, i) => (
              <div key={i} className="text-[var(--ink)]">
                <span className="font-medium">{ed.degree}</span>
                {ed.school && ` · ${ed.school}`}
                {ed.period && (
                  <span className="text-[var(--ink-muted)] text-[11px]">
                    {" "}
                    ({ed.period})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
