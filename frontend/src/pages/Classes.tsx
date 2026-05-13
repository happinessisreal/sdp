import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { formatDate } from "@/lib/format";
import type { ClassItem, Student, Teacher } from "@/types/api";
import { CalendarDays, Check, Link2, Pencil, Plus, Search, Trash2, X } from "lucide-react";

const emptyClassForm = {
  name: "",
  teacher_id: "",
  date: "",
  start_time: "",
  number_of_days_a_week: "3",
};

function toDateInput(value?: string | null) {
  return value ? new Date(value).toISOString().split("T")[0] || "" : "";
}

export function Classes() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "TEACHER";
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyClassForm);
  const [editing, setEditing] = useState<{
    id: number;
    name: string;
    date: string;
    start_time: string;
    number_of_days_a_week: string;
  } | null>(null);
  const [enrollment, setEnrollment] = useState({ class_id: "", student_id: "" });
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/classes", { params: { search } });
      setClasses(res.data.data);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to fetch classes."
          : "Failed to fetch classes."
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchSupportingData = useCallback(async () => {
    try {
      const requests: Promise<void>[] = [];

      if (user?.role === "ADMIN") {
        requests.push(
          api.get("/teachers").then((res) => {
            setTeachers(res.data.data);
          })
        );
      }

      if (canManage) {
        requests.push(
          api.get("/students").then((res) => {
            setStudents(res.data.data);
          })
        );
      }

      await Promise.all(requests);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to fetch class form data."
          : "Failed to fetch class form data."
      );
    }
  }, [canManage, user?.role]);

  useEffect(() => {
    void fetchSupportingData();
  }, [fetchSupportingData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchClasses();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [fetchClasses]);

  const createClass = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await api.post("/classes", {
        name: form.name,
        teacher_id: user?.role === "ADMIN" ? Number(form.teacher_id) : undefined,
        date: form.date || undefined,
        start_time: form.start_time || undefined,
        number_of_days_a_week: form.number_of_days_a_week
          ? Number(form.number_of_days_a_week)
          : undefined,
      });
      setForm(emptyClassForm);
      await fetchClasses();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to create class."
          : "Failed to create class."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateClass = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      setError(null);
      await api.put(`/classes/${editing.id}`, {
        name: editing.name,
        date: editing.date || undefined,
        start_time: editing.start_time || undefined,
        number_of_days_a_week: editing.number_of_days_a_week
          ? Number(editing.number_of_days_a_week)
          : undefined,
      });
      setEditing(null);
      await fetchClasses();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to update class."
          : "Failed to update class."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteClass = async (classItem: ClassItem) => {
    if (!window.confirm(`Delete ${classItem.name}?`)) return;

    try {
      setSaving(true);
      setError(null);
      await api.delete(`/classes/${classItem.id}`);
      await fetchClasses();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to delete class."
          : "Failed to delete class."
      );
    } finally {
      setSaving(false);
    }
  };

  const enrollStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await api.post("/enrollments", {
        class_id: Number(enrollment.class_id),
        student_id: Number(enrollment.student_id),
      });
      setEnrollment({ class_id: "", student_id: "" });
      await fetchClasses();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to enroll student."
          : "Failed to enroll student."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {user?.role === "STUDENT" ? "My Classes" : "Classes"}
          </h2>
          <p className="mt-1 text-surface-600">Plan schedules, assign teachers, and manage enrollments.</p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-surface-500" />
          <Input
            placeholder="Search classes"
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

      {canManage && (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-primary-600" />
                Add Class
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={createClass}>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="class-name">Class Name</Label>
                  <Input
                    id="class-name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </div>
                {user?.role === "ADMIN" && (
                  <div className="space-y-2">
                    <Label htmlFor="class-teacher">Teacher</Label>
                    <Select
                      id="class-teacher"
                      value={form.teacher_id}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, teacher_id: event.target.value }))
                      }
                      required
                    >
                      <option value="">Select teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.user.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="class-date">Start Date</Label>
                  <Input
                    id="class-date"
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-time">Time</Label>
                  <Input
                    id="class-time"
                    type="time"
                    value={form.start_time}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, start_time: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-days">Days/Week</Label>
                  <Input
                    id="class-days"
                    type="number"
                    min={1}
                    max={7}
                    value={form.number_of_days_a_week}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        number_of_days_a_week: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full gap-2" disabled={saving}>
                    <Plus className="h-4 w-4" />
                    Add Class
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link2 className="h-5 w-5 text-primary-600" />
                Enroll
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={enrollStudent}>
                <div className="space-y-2">
                  <Label htmlFor="enroll-class">Class</Label>
                  <Select
                    id="enroll-class"
                    value={enrollment.class_id}
                    onChange={(event) =>
                      setEnrollment((current) => ({ ...current, class_id: event.target.value }))
                    }
                    required
                  >
                    <option value="">Select class</option>
                    {classes.map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enroll-student">Student</Label>
                  <Select
                    id="enroll-student"
                    value={enrollment.student_id}
                    onChange={(event) =>
                      setEnrollment((current) => ({ ...current, student_id: event.target.value }))
                    }
                    required
                  >
                    <option value="">Select student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={saving}>
                  <Link2 className="h-4 w-4" />
                  Enroll Student
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="h-64 w-full animate-pulse rounded-lg bg-surface-200" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Records</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="h-24 text-center text-surface-600">
                  No classes found.
                </TableCell>
              </TableRow>
            ) : (
              classes.map((classItem) => {
                const isEditing = editing?.id === classItem.id;

                return (
                  <TableRow key={classItem.id}>
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
                        classItem.name
                      )}
                    </TableCell>
                    <TableCell>{classItem.teacher.user.name}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="grid gap-2 md:grid-cols-3">
                          <Input
                            type="date"
                            value={editing.date}
                            onChange={(event) =>
                              setEditing((current) =>
                                current ? { ...current, date: event.target.value } : current
                              )
                            }
                          />
                          <Input
                            type="time"
                            value={editing.start_time}
                            onChange={(event) =>
                              setEditing((current) =>
                                current ? { ...current, start_time: event.target.value } : current
                              )
                            }
                          />
                          <Input
                            type="number"
                            min={1}
                            max={7}
                            value={editing.number_of_days_a_week}
                            onChange={(event) =>
                              setEditing((current) =>
                                current
                                  ? { ...current, number_of_days_a_week: event.target.value }
                                  : current
                              )
                            }
                          />
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          <div>{formatDate(classItem.date)}</div>
                          <div className="text-surface-500">
                            {classItem.start_time || "No time"} - {classItem.number_of_days_a_week || 0} days/week
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="blue">{classItem._count?.enrollments || 0} students</Badge>
                        <Badge tone="green">{classItem._count?.attendances || 0} attendance</Badge>
                      </div>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button size="icon" title="Save" disabled={saving} onClick={updateClass}>
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
                                onClick={() =>
                                  setEditing({
                                    id: classItem.id,
                                    name: classItem.name,
                                    date: toDateInput(classItem.date),
                                    start_time: classItem.start_time || "",
                                    number_of_days_a_week: String(classItem.number_of_days_a_week || ""),
                                  })
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="danger"
                                title="Delete"
                                disabled={saving}
                                onClick={() => void deleteClass(classItem)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
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
