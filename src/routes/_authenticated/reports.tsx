import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, Printer, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports — Enroll.AI" }] }),
});

function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const [students, enrollments] = await Promise.all([
        supabase.from("students").select("*"),
        supabase.from("enrollments").select("*").order("year").order("semester"),
      ]);
      return { students: students.data ?? [], enrollments: enrollments.data ?? [] };
    },
  });

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Enroll.AI — Student Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [["Student No", "Name", "Program", "Year", "Status"]],
      body: data.students.map((s) => [s.student_no, s.full_name, s.program, s.year_level, s.status]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [10, 10, 10] },
    });
    doc.save("students-report.pdf");
    toast.success("PDF downloaded");
  };

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.students), "Students");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.enrollments), "Enrollments");
    XLSX.writeFile(wb, "enrollment-report.xlsx");
    toast.success("Excel downloaded");
  };

  if (isLoading || !data) return <Skeleton className="h-96" />;

  const total = data.students.length;
  const programs = new Set(data.students.map((s) => s.program)).size;
  const totalEnroll = data.enrollments.reduce((a, b) => a + b.count, 0);

  // Aggregate by program
  const byProgram: Record<string, number> = {};
  data.enrollments.forEach((e) => { byProgram[e.program] = (byProgram[e.program] ?? 0) + e.count; });

  return (
    <div className="space-y-5">
      <div className="card-elevated flex flex-col gap-3 p-5 no-print md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold">Reports & Analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">Download or print summary reports for distribution.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-1.5 h-4 w-4" />Print</Button>
          <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="mr-1.5 h-4 w-4" />Excel</Button>
          <Button onClick={exportPDF}><FileDown className="mr-1.5 h-4 w-4" />PDF</Button>
        </div>
      </div>

      <div className="card-elevated p-6 print:shadow-none">
        <div className="border-b border-border pb-5">
          <h1 className="text-xl font-semibold tracking-tight">Enrollment Summary Report</h1>
          <p className="mt-1 text-xs text-muted-foreground">Generated {new Date().toLocaleString()}</p>
        </div>

        <div className="my-6 grid gap-4 md:grid-cols-3">
          <Stat label="Total Students" value={total} />
          <Stat label="Programs" value={programs} />
          <Stat label="Historical Enrollments" value={totalEnroll.toLocaleString()} />
        </div>

        <h2 className="mt-6 text-sm font-semibold">Enrollment by Program</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>{["Program", "Total Enrolled", "Share"].map((h) => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {Object.entries(byProgram).map(([p, c]) => (
              <tr key={p} className="border-t border-border">
                <td className="px-4 py-2">{p}</td>
                <td className="px-4 py-2">{c.toLocaleString()}</td>
                <td className="px-4 py-2">{((c / totalEnroll) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-8 text-sm font-semibold">Student Roster (sample of {Math.min(20, data.students.length)})</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>{["Student No", "Name", "Program", "Year", "Status"].map((h) => <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {data.students.slice(0, 20).map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono text-xs">{s.student_no}</td>
                <td className="px-4 py-2">{s.full_name}</td>
                <td className="px-4 py-2 text-muted-foreground">{s.program}</td>
                <td className="px-4 py-2">{s.year_level}</td>
                <td className="px-4 py-2">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
