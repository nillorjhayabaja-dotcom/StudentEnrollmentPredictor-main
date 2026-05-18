import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Brain, Database, ShieldCheck, Sparkles, LineChart, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Enroll.AI — AI Student Enrollment Forecasting" },
      { name: "description", content: "Modern admin dashboard for student management with AI-powered enrollment forecasting." },
    ],
  }),
});

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Enroll.AI</span>
          </div>
          <nav className="flex items-center gap-2">
            <a href="#features" className="hidden text-xs font-medium text-muted-foreground hover:text-foreground sm:inline">Features</a>
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/login">
              <Button size="sm" className="group">
                Open dashboard
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 dot-pattern opacity-70" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/[0.04] blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center md:py-32">
          <motion.div {...fade(0)} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3" />
            AI forecasting · Real-time analytics · Built for schools
          </motion.div>
          <motion.h1 {...fade(0.08)} className="mx-auto mt-6 max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
            <span className="text-gradient">Predict tomorrow's enrollment.</span>
            <br />
            Run today's school better.
          </motion.h1>
          <motion.p {...fade(0.16)} className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
            A modern full-stack platform with built-in time-series forecasting, live
            dashboards and exportable reports — designed for registrars who think in seasons.
          </motion.p>
          <motion.div {...fade(0.24)} className="mt-8 flex items-center justify-center gap-3">
            <Link to="/login">
              <Button size="lg" className="group h-11 px-6">
                Launch dashboard
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-11 px-6">Create account</Button>
            </Link>
          </motion.div>

          {/* mock dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
            className="relative mx-auto mt-16 max-w-5xl"
          >
            <div className="card-elevated overflow-hidden p-2 shadow-glow">
              <div className="rounded-lg border border-border bg-muted/40 p-6">
                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    { l: "Total students", v: "1,284" },
                    { l: "Programs", v: "4" },
                    { l: "Next forecast", v: "+4.2%" },
                    { l: "Confidence", v: "95%" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-md border border-border bg-card p-3 text-left">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                      <p className="mt-1 text-xl font-semibold">{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-44 rounded-md border border-border bg-card p-4">
                  <MockChart />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Capabilities</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Everything a registrar needs, nothing they don't.</h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Database, title: "Full CRUD", body: "Search, filter, and manage every student record with elegant pagination." },
            { icon: BarChart3, title: "Live analytics", body: "KPI cards, gender split, program trends, and semester-over-semester growth." },
            { icon: Brain, title: "AI forecasting", body: "Holt-Winters seasonal model projects 4 semesters with confidence intervals." },
            { icon: LineChart, title: "Beautiful charts", body: "Editorial chart styling with responsive interactions and clean labels." },
            { icon: Layers, title: "Exportable reports", body: "One-click PDF and Excel exports for board-ready summaries." },
            { icon: ShieldCheck, title: "Secure by default", body: "Email + password authentication with row-level security on every table." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="card-elevated hover-lift p-5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Ready to see your numbers?</h2>
          <p className="mt-3 text-sm text-muted-foreground">Sign in and explore the full dashboard with seeded sample data.</p>
          <Link to="/login">
            <Button size="lg" className="mt-7 h-11 px-7">Launch the dashboard</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Built as a portfolio project · React · TanStack Start · Lovable Cloud
      </footer>
    </div>
  );
}

function MockChart() {
  const points = [12, 18, 14, 22, 28, 24, 34, 40, 38, 46, 52, 58];
  const max = Math.max(...points);
  const w = 100, h = 100;
  const step = w / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * h}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)" className="text-foreground" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="0.7" className="text-foreground" />
    </svg>
  );
}
