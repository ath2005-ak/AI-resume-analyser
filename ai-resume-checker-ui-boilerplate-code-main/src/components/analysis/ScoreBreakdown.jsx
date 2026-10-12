import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export function ScoreBreakdown({ breakdown = {} }) {
  const safeBreakdown = breakdown || {};
  const data = [
    { axis: "Keywords", v: Number(safeBreakdown.keywords ?? 0), full: 25 },
    { axis: "Formatting", v: Number(safeBreakdown.formatting ?? 0), full: 25 },
    { axis: "Impact", v: Number(safeBreakdown.impact ?? 0), full: 25 },
    { axis: "Clarity", v: Number(safeBreakdown.clarity ?? 0), full: 25 },
  ];

  return (
    <Card className="h-full" role="region" aria-label="ATS Score Breakdown">
      <CardHeader>
        <div>
          <CardTitle className="text-base">Score Breakdown</CardTitle>
          <CardDescription className="mt-1">Each axis scored out of 25</CardDescription>
        </div>
      </CardHeader>
      <div className="h-[230px] -mx-2" aria-hidden="true">
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
            />
            <PolarRadiusAxis domain={[0, 25]} tick={false} axisLine={false} />
            <Radar
              dataKey="v"
              stroke="var(--accent)"
              fill="var(--accent)"
              fillOpacity={0.18}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-[var(--border)]">
        {data.map((d) => (
          <div key={d.axis} className="text-center">
            <div className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
              {d.axis}
            </div>
            <div className="font-display tabular text-lg font-semibold mt-0.5">
              {d.v}
              <span className="text-xs text-[var(--ink-muted)] font-normal ml-0.5">
                /25
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
