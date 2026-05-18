import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart,
} from "recharts";
import { forecast, type Point } from "@/lib/forecast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Target, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/use-count-up";

export const Route = createFileRoute("/_authenticated/forecast")({
  component: ForecastPage,
  head: () => ({ meta: [{ title: "Forecast — Enroll.AI" }] }),
});

function ForecastPage() {
  const [program, setProgram] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["enrollments-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("enrollments").select("*").order("year").order("semester");
      if (error) throw error;
      return data;
    },
  });

  const programs = useMemo(() => Array.from(new Set((data ?? []).map((e) => e.program))).sort(), [data]);

  const { history, projection, summary } = useMemo(() => {
    if (!data) return { history: [], projection: [], summary: null as any };
    const filtered = program === "all" ? data : data.filter((e) => e.program === program);
    const map = new Map<string, number>();
    filtered.forEach((e) => {
      const key = `${e.year}-${e.semester}`;
      map.set(key, (map.get(key) ?? 0) + e.count);
    });
    const series: Point[] = Array.from(map.entries())
      .sort()
      .map(([k, v], i) => {
        const [y, s] = k.split("-");
        return { t: i + 1, y: v, label: `${y} S${s}` };
      });
    const fc = forecast(series, 4, 2);
    const total = series.reduce((a, b) => a + b.y, 0);
    const last = series[series.length - 1]?.y ?? 0;
    const next = fc[0]?.yhat ?? 0;
    const growth = last ? ((next - last) / last) * 100 : 0;
    const peak = fc.reduce((a, b) => Math.max(a, b.yhat), 0);
    const avgBand = fc.length ? fc.reduce((a, b) => a + (b.upper - b.lower), 0) / fc.length : 0;
    const confidence = last ? Math.max(0, 100 - (avgBand / last) * 50) : 0;
    const sum = { total, last, next, growth, peak, confidence };
    const history = series.map((p) => ({ label: p.label, actual: p.y }));
    const projection = fc.map((f) => ({ label: f.label, forecast: f.yhat, lower: f.lower, upper: f.upper, band: f.upper - f.lower }));
    return { history, projection, summary: sum };
  }, [data, program]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const combined = [
    ...history.map((h) => ({ label: h.label, actual: h.actual })),
    ...projection.map((p) => ({ label: p.label, forecast: p.forecast, lower: p.lower, upper: p.upper })),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="card-elevated relative overflow-hidden p-5 md:p-6"
      >
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">AI Enrollment Forecast</h2>
                <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">Live</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Holt-Winters seasonal model · 4-semester horizon · 95% confidence interval
              </p>
            </div>
          </div>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger className="h-10 w-full md:w-72"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs combined</SelectItem>
              {programs.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Insight cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Insight index={0} icon={Activity} label="Historic Total" value={summary.total} />
          <Insight index={1} icon={Target} label="Latest Semester" value={summary.last} />
          <Insight index={2} icon={TrendingUp} label="Next Forecast" value={summary.next} highlight />
          <Insight index={3} icon={summary.growth >= 0 ? ArrowUpRight : ArrowDownRight} label="Projected Growth" value={Math.abs(Math.round(summary.growth * 10) / 10)} suffix="%" trend={summary.growth} />
        </div>
      )}

      {/* Forecast chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="card-elevated p-5"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Forecast vs actual</h3>
            <p className="text-xs text-muted-foreground">Shaded band is 95% confidence interval</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Legend2 label="Actual" solid />
            <Legend2 label="Forecast" dashed />
            <Legend2 label="95% CI" fill />
          </div>
        </div>
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combined} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 10, border: "1px solid var(--color-border)",
                  background: "var(--color-popover)", color: "var(--color-popover-foreground)",
                  fontSize: 12, boxShadow: "var(--shadow-card)",
                }}
                labelStyle={{ color: "var(--color-popover-foreground)" }}
                itemStyle={{ color: "var(--color-popover-foreground)" }}
              />
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandFill)" className="text-foreground" isAnimationActive />
              <Area type="monotone" dataKey="lower" stroke="none" fill="var(--color-card)" isAnimationActive />
              <Line type="monotone" dataKey="actual" stroke="currentColor" strokeWidth={2.5} dot={{ r: 3 }} className="text-foreground" isAnimationActive animationDuration={800} />
              <Line type="monotone" dataKey="forecast" stroke="currentColor" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 3 }} strokeOpacity={0.55} className="text-foreground" isAnimationActive animationDuration={800} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Forecast table + Model note */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="card-elevated p-5 lg:col-span-2"
        >
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Forecast table</h3>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {["Period", "Forecast", "Lower 95%", "Upper 95%", "Range"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projection.map((p, i) => (
                  <motion.tr
                    key={p.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="border-t border-border hover:bg-muted/30"
                  >
                    <td className="px-4 py-2.5 font-medium">{p.label}</td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums">{p.forecast.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{p.lower.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{p.upper.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">±{Math.round(p.band / 2).toLocaleString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="card-elevated p-5"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Model details</h3>
          </div>
          <dl className="mt-4 space-y-2.5 text-xs">
            <Row k="Algorithm" v="Holt-Winters additive" />
            <Row k="Alpha (level)" v="0.5" />
            <Row k="Beta (trend)" v="0.25" />
            <Row k="Gamma (season)" v="0.4" />
            <Row k="Seasonality" v="2 (semesters)" />
            <Row k="Horizon" v="4 periods" />
            <Row k="CI method" v="Residual SE × √h" />
          </dl>
          <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Confidence bands widen with horizon to reflect compounding uncertainty.
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Insight({ icon: Icon, label, value, suffix, highlight, trend, index = 0 }: {
  icon: any; label: string; value: number; suffix?: string; highlight?: boolean; trend?: number; index?: number;
}) {
  const animated = useCountUp(value);
  const positive = (trend ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className={`card-elevated hover-lift group relative overflow-hidden p-5 ${highlight ? "ring-1 ring-foreground/10" : ""}`}
    >
      {highlight && <div className="absolute inset-0 dot-pattern opacity-40" />}
      <div className="relative flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        <div className={`flex h-7 w-7 items-center justify-center rounded-md border border-border ${highlight ? "bg-primary text-primary-foreground" : "bg-muted/40"}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="relative mt-4 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">
          {trend !== undefined && (positive ? "+" : "-")}{animated.toLocaleString()}{suffix}
        </span>
      </div>
      {trend !== undefined && (
        <p className={`relative mt-1 text-[11px] ${positive ? "text-muted-foreground" : "text-destructive"}`}>
          vs. last period
        </p>
      )}
    </motion.div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-mono font-medium">{v}</dd>
    </div>
  );
}

function Legend2({ label, solid, dashed, fill }: { label: string; solid?: boolean; dashed?: boolean; fill?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      {fill ? (
        <span className="inline-block h-2.5 w-5 rounded-sm bg-foreground/15" />
      ) : (
        <span
          className="inline-block h-0 w-5 border-foreground"
          style={{ borderTopWidth: 2, borderStyle: dashed ? "dashed" : "solid" }}
        />
      )}
      {label}
    </span>
  );
}
