import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { ArrowLeft, Download, FileText, Loader2, Check, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { VersionSwitcher } from "@/components/resume/VersionSwitcher";
import { ResumeDocument } from "@/components/export/ResumeDocument";
import { downloadResumeDocx } from "@/lib/docxExport";
import { useResume, useFullVersion } from "@/hooks/useResumes";
import { useAuth } from "@/context/AuthContext";

const TEMPLATES = [
  {
    id: "modern",
    name: "Modern Minimalist",
    desc: "Clean sans-serif typography with emerald forest accents",
    tag: "Recommended",
  },
  {
    id: "executive",
    name: "Classic Executive",
    desc: "Refined serif font, formal navy accents, centered header",
    tag: "Formal",
  },
  {
    id: "tech",
    name: "Compact Technical",
    desc: "High-density developer layout with slate/sky accents",
    tag: "Dense",
  },
];

export default function Export() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, error } = useResume(id);
  const resume = data?.resume;
  const versions = data?.versions || [];

  const [activeVersionId, setActiveVersionId] = useState(null);
  const [template, setTemplate] = useState("modern");
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  useEffect(() => {
    if (!activeVersionId && versions.length) {
      setActiveVersionId(resume?.currentVersionId || versions[versions.length - 1]._id);
    }
  }, [versions, resume, activeVersionId]);

  const fullVersion = useFullVersion(id, activeVersionId);
  const version = fullVersion.data;

  const docProps = useMemo(
    () => ({ user, version, title: resume?.title, template }),
    [user, version, resume?.title, template]
  );

  const fileName = useMemo(() => {
    const base = (resume?.title || "resume")
      .replace(/[^a-z0-9\-_ ]/gi, "")
      .trim()
      .replace(/\s+/g, "_");
    return `${base}_${version?.label || "V1"}_${template}.pdf`;
  }, [resume?.title, version?.label, template]);

  async function handleDocxExport() {
    if (!version) return;
    setIsExportingDocx(true);
    try {
      await downloadResumeDocx({
        version,
        title: resume?.title,
        template,
      });
    } catch (err) {
      console.error("DOCX Export error:", err);
    } finally {
      setIsExportingDocx(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3 rounded-2xl" />
        <Skeleton className="h-[600px] rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={FileText}
        title="Couldn't load resume"
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
        title={`Export — ${resume?.title || "Resume"}`}
        description="Select a template, preview the layout, and export to PDF or editable Word (.docx)."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => nav(`/resumes/${id}`)}>
              <ArrowLeft size={14} /> Back to resume
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex-wrap gap-4">
          <div>
            <CardTitle className="text-base">Version & Template</CardTitle>
            <CardDescription className="mt-1">
              Choose the version and styling theme for your export
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <VersionSwitcher
              versions={versions}
              activeId={activeVersionId}
              onChange={setActiveVersionId}
            />

            {/* Word DOCX Download */}
            <Button
              variant="outline"
              size="md"
              onClick={handleDocxExport}
              disabled={isExportingDocx || !version}
              className="gap-2"
            >
              {isExportingDocx ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Generating DOCX…
                </>
              ) : (
                <>
                  <FileText size={14} className="text-blue-600 dark:text-blue-400" /> Download DOCX
                </>
              )}
            </Button>

            {/* PDF Download */}
            {version && (
              <PDFDownloadLink
                document={<ResumeDocument {...docProps} />}
                fileName={fileName}
              >
                {({ loading }) => (
                  <Button variant="accent" size="md" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Preparing…
                      </>
                    ) : (
                      <>
                        <Download size={14} /> Download PDF
                      </>
                    )}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </div>
        </CardHeader>

        {/* Template Selector Cards */}
        <div className="mt-2 pt-4 border-t border-[var(--border)]">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] mb-3">
            Choose Resume Template
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TEMPLATES.map((tmpl) => {
              const isSelected = template === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setTemplate(tmpl.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]/50 ring-1 ring-[var(--accent)] shadow-sm"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-[var(--ink)]">
                      {tmpl.name}
                    </span>
                    <Badge tone={isSelected ? "accent" : "muted"}>
                      {tmpl.tag}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                    {tmpl.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {version?.sourceType === "rewrite" && (
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-muted)] pt-3 border-t border-[var(--border)]">
            <Badge tone="accent">AI-improved</Badge>
            This version was generated by applying verified rewrites.
          </div>
        )}
      </Card>

      {fullVersion.isLoading && (
        <Skeleton className="h-[800px] rounded-3xl" />
      )}

      {fullVersion.error && (
        <EmptyState
          icon={FileText}
          title="Couldn't load this version"
          description={fullVersion.error.message}
        />
      )}

      {version && (
        <Card padding="none" className="overflow-hidden">
          <PDFViewer
            key={template}
            style={{
              width: "100%",
              height: "min(85vh, 1000px)",
              border: "none",
              borderRadius: 20,
            }}
            showToolbar={false}
          >
            <ResumeDocument {...docProps} />
          </PDFViewer>
        </Card>
      )}
    </div>
  );
}
