import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function StrengthsList({ strengths = [] }) {
  const safeStrengths = Array.isArray(strengths) ? strengths : [];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base">Strengths</CardTitle>
          <CardDescription className="mt-1">
            What's already working for you
          </CardDescription>
        </div>
        <Badge tone="success" aria-label={`${safeStrengths.length} identified strengths`}>
          {safeStrengths.length}
        </Badge>
      </CardHeader>
      <div className="space-y-7">
        {safeStrengths.length === 0 ? (
          <div className="text-xs text-[var(--ink-muted)] p-4 text-center">
            No distinct strengths recorded yet.
          </div>
        ) : (
          safeStrengths.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="shrink-0 w-8 flex items-start justify-center pt-0.5">
                <span
                  className="font-display tabular-nums text-[18px] font-semibold leading-none tracking-tight"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #B6CFC0 0%, var(--accent) 45%, var(--accent-strong) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[var(--ink)]">{s.title}</div>
                {s.evidence && (
                  <div className="text-xs text-[var(--ink-muted)] mt-0.5 leading-relaxed">
                    {s.evidence}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
