import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { formatDate } from "@/lib/format";
import type { Teacher } from "@/types/api";
import { Check, GraduationCap, Pencil, Plus, Search, Trash2, X } from "lucide-react";

const emptyTeacherForm = {
  name: "",
  email: "",
  password: "teacher123",
};

export function Teachers() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyTeacherForm);
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/teachers", { params: { search } });
      setTeachers(res.data.data);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to fetch teachers."
          : "Failed to fetch teachers."
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTeachers();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [fetchTeachers]);

  const createTeacher = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await api.post("/teachers", form);
      setForm(emptyTeacherForm);
      await fetchTeachers();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to create teacher."
          : "Failed to create teacher."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateTeacher = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      setError(null);
      await api.put(`/teachers/${editing.id}`, { name: editing.name });
      setEditing(null);
      await fetchTeachers();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to update teacher."
          : "Failed to update teacher."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteTeacher = async (teacher: Teacher) => {
    if (!window.confirm(`Delete ${teacher.user.name}? Their classes will also be removed.`)) return;

    try {
      setSaving(true);
      setError(null);
      await api.delete(`/teachers/${teacher.id}`);
      await fetchTeachers();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to delete teacher."
          : "Failed to delete teacher."
      );
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Teachers</h2>
        <p className="text-surface-600">Teacher management is available to administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teachers</h2>
          <p className="mt-1 text-surface-600">Create teacher accounts and monitor class ownership.</p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-surface-500" />
          <Input
            placeholder="Search teachers"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-primary-600" />
            Add Teacher
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={createTeacher}>
            <div className="space-y-2">
              <Label htmlFor="teacher-name">Name</Label>
              <Input
                id="teacher-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-email">Email</Label>
              <Input
                id="teacher-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-password">Password</Label>
              <Input
                id="teacher-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                minLength={6}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full gap-2" disabled={saving}>
                <Plus className="h-4 w-4" />
                Add Teacher
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="h-64 w-full animate-pulse rounded-lg bg-surface-200" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Records</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-surface-600">
                  No teachers found.
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => {
                const isEditing = editing?.id === teacher.id;

                return (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      {isEditing ? (
                        <Input
                          value={editing.name}
                          onChange={(event) =>
                            setEditing((current) =>
                              current ? { ...current, name: event.target.value } : current
                            )
                          }
                        />
                      ) : (
                        teacher.user.name
                      )}
                    </TableCell>
                    <TableCell>{teacher.user.email}</TableCell>
                    <TableCell>{formatDate(teacher.user.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="blue">{teacher._count?.classes || 0} classes</Badge>
                        <Badge tone="green">{teacher._count?.payments || 0} payments</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button size="icon" title="Save" disabled={saving} onClick={updateTeacher}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              title="Cancel"
                              onClick={() => setEditing(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="outline"
                              title="Edit"
                              onClick={() => setEditing({ id: teacher.id, name: teacher.user.name })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="danger"
                              title="Delete"
                              disabled={saving}
                              onClick={() => void deleteTeacher(teacher)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
