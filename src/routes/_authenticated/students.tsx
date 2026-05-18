import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Users, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { motion, AnimatePresence } from "framer-motion";

type Student = Tables<"students">;
const STATUSES = ["Active", "Inactive", "Graduated", "Dropped"];
const PAGE_SIZE = 10;

export const Route = createFileRoute("/_authenticated/students")({
  component: StudentsPage,
  head: () => ({ meta: [{ title: "Students — Enroll.AI" }] }),
});

function emptyForm(): Partial<Student> {
  return { student_no: "", full_name: "", gender: "Male", program: undefined, year_level: 1, status: "Active", email: "" };
}

function statusVariant(s: string) {
  switch (s) {
    case "Active": return "default";
    case "Graduated": return "secondary";
    case "Inactive": return "outline";
    case "Dropped": return "destructive";
    default: return "secondary";
  }
}

function StudentsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Partial<Student>>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const programOptions = useMemo(() => {
    const programs = new Set<string>();
    (data ?? []).forEach((s) => {
      if (s.program) programs.add(s.program);
    });
    return Array.from(programs).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((s) => {
      const ql = q.toLowerCase();
      const matchesQ = !q || s.full_name.toLowerCase().includes(ql) || s.student_no.toLowerCase().includes(ql) || (s.email ?? "").toLowerCase().includes(ql);
      const matchesP = programFilter === "all" || s.program === programFilter;
      const matchesS = statusFilter === "all" || s.status === statusFilter;
      return matchesQ && matchesP && matchesS;
    });
  }, [data, q, programFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const save = useMutation({
    mutationFn: async (payload: Partial<Student>) => {
      if (editing) {
        const { error } = await supabase.from("students").update(payload).eq("id", editing.id);
        if (error) throw error;
        await supabase.from("activity_log").insert({ action: "Student Updated", detail: payload.full_name ?? "" });
      } else {
        const { error } = await supabase.from("students").insert(payload as any);
        if (error) throw error;
        await supabase.from("activity_log").insert({ action: "Student Added", detail: payload.full_name ?? "" });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Student updated" : "Student added");
      setOpen(false); setEditing(null); setForm(emptyForm());
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (s: Student) => {
      const { error } = await supabase.from("students").delete().eq("id", s.id);
      if (error) throw error;
      await supabase.from("activity_log").insert({ action: "Student Deleted", detail: s.full_name });
    },
    onSuccess: () => {
      toast.success("Student deleted");
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (s: Student) => { setEditing(s); setForm(s); setOpen(true); };
  const openNew = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };

  const activeFilters = (programFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (q ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="card-elevated p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row">
            <div className="group relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Search by name, student no, or email…"
                className="h-10 pl-9 pr-9"
              />
              {q && (
                <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <Select value={programFilter} onValueChange={(v) => { setProgramFilter(v); setPage(1); }}>
              <SelectTrigger className="h-10 w-full sm:w-56"><SelectValue placeholder="All programs" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {programOptions.length === 0 ? (
                  <SelectItem value="" disabled>
                    No programs available
                  </SelectItem>
                ) : (
                  programOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)
                )}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-10 w-full sm:w-40"><SelectValue placeholder="All status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {activeFilters > 0 && (
              <button
                onClick={() => { setQ(""); setProgramFilter("all"); setStatusFilter("all"); }}
                className="flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <SlidersHorizontal className="h-3 w-3" /> Reset ({activeFilters})
              </button>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNew} className="h-10"><Plus className="mr-1.5 h-4 w-4" />Add student</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit student" : "Add new student"}</DialogTitle>
                  <DialogDescription>
                    {editing ? "Update the student information below." : "Fill in the student details to add them to the roster."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Student No"><Input value={form.student_no ?? ""} onChange={(e) => setForm({ ...form, student_no: e.target.value })} /></Field>
                  <Field label="Full Name"><Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
                  <Field label="Email"><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                  <Field label="Gender">
                    <Select value={form.gender ?? "Male"} onValueChange={(v) => setForm({ ...form, gender: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Male", "Female", "Other"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Program">
                    <Select
                      value={form.program ?? programOptions[0] ?? ""}
                      onValueChange={(v) => setForm({ ...form, program: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {programOptions.length === 0 ? (
                          <SelectItem value="" disabled>
                            No programs available
                          </SelectItem>
                        ) : (
                          programOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Year Level">
                    <Select value={String(form.year_level ?? 1)} onValueChange={(v) => setForm({ ...form, year_level: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1, 2, 3, 4, 5].map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Status">
                    <Select value={form.status ?? "Active"} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={() => save.mutate(form)} disabled={save.isPending}>{editing ? "Save changes" : "Create student"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {!isLoading && data && (
          <p className="mt-3 text-xs text-muted-foreground">
            {filtered.length === data.length ? `${data.length} students` : `${filtered.length} of ${data.length} students`}
          </p>
        )}
      </motion.div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={openNew} hasFilters={activeFilters > 0} onClear={() => { setQ(""); setProgramFilter("all"); setStatusFilter("all"); }} />
        ) : (
          <>
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/80 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
                  <tr>
                    {["Student", "Program", "Year", "Status", "Enrolled", ""].map((h) => (
                      <th key={h} className="border-b border-border px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paged.map((s, i) => (
                      <motion.tr
                        key={s.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.02 }}
                        className="group border-b border-border last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[11px] font-semibold uppercase">
                              {s.full_name.slice(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{s.full_name}</p>
                              <p className="truncate font-mono text-[11px] text-muted-foreground">{s.student_no}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{s.program}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-xs">Y{s.year_level}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant(s.status) as any}>{s.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(s.enrollment_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                            <Button variant="ghost" size="icon" aria-label="Edit student" onClick={() => openEdit(s)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Delete student" onClick={() => setConfirmDelete(s)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="flex flex-col items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row">
              <span>Showing <span className="font-medium text-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-medium text-foreground">{filtered.length}</span></span>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span>Page {page} of {totalPages}</span>
                <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-medium text-foreground">{confirmDelete?.full_name}</span> from your roster. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDelete) remove.mutate(confirmDelete); setConfirmDelete(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}

function EmptyState({ onAdd, hasFilters, onClear }: { onAdd: () => void; hasFilters: boolean; onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <span className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-foreground/5" />
      </div>
      <h3 className="mt-5 text-base font-semibold">{hasFilters ? "No students match" : "No students yet"}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        {hasFilters ? "Try adjusting your filters to see more results." : "Add the first student to your roster to get started."}
      </p>
      <div className="mt-6 flex gap-2">
        {hasFilters && <Button variant="outline" onClick={onClear}>Clear filters</Button>}
        <Button onClick={onAdd}><Plus className="mr-1.5 h-4 w-4" />Add student</Button>
      </div>
    </motion.div>
  );
}
