import { useCallback, useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import { formatDate, todayInputValue } from "@/lib/format";
import type { AttendanceRecord, AttendanceStatus, ClassItem, Enrollment } from "@/types/api";
import { CheckCircle2, Clock3, Save, Users, XCircle } from "lucide-react";

const statusMeta: Record<AttendanceStatus, { label: string; tone: "green" | "amber" | "red"; icon: typeof CheckCircle2 }> = {
  PRESENT: { label: "Present", tone: "green", icon: CheckCircle2 },
  LATE: { label: "Late", tone: "amber", icon: Clock3 },
  ABSENT: { label: "Absent", tone: "red", icon: XCircle },
};

function StatusButton({
  status,
  active,
  onClick,
}: {
  status: AttendanceStatus;
  active: boolean;
  onClick: () => void;
}) {
  const meta = statusMeta[status];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
        active
          ? "border-primary-600 bg-primary-600 text-white"
          : "border-surface-200 bg-white text-surface-700 hover:bg-surface-50"
      )}
      title={meta.label}
    >
      <Icon className="h-4 w-4" />
      {meta.label}
    </button>
  );
}

export function Attendance() {
  const { user } = useAuth();
  const canRecord = user?.role === "ADMIN" || user?.role === "TEACHER";
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statusByStudent, setStatusByStudent] = useState<Record<number, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get("/classes");
      setClasses(res.data.data);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to fetch classes."
          : "Failed to fetch classes."
      );
    }
  }, []);

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (!classId && classes.length > 0) {
      setClassId(String(classes[0].id));
    }
  }, [classId, classes]);

  const fetchAttendance = useCallback(async () => {
    if (!classId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (canRecord) {
        const [studentsRes, recordsRes] = await Promise.all([
          api.get(`/classes/${classId}/students`),
          api.get("/attendance", { params: { classId, date } }),
        ]);
        const classEnrollments = studentsRes.data.data as Enrollment[];
        const classRecords = recordsRes.data.data as AttendanceRecord[];
        const nextStatus: Record<number, AttendanceStatus> = {};

        for (const enrollment of classEnrollments) {
          nextStatus[enrollment.student_id] = "PRESENT";
        }

        for (const record of classRecords) {
          nextStatus[record.student_id] = record.status;
        }

        setEnrollments(classEnrollments);
        setRecords(classRecords);
        setStatusByStudent(nextStatus);
      } else if (user?.student?.id) {
        const res = await api.get(`/attendance/student/${user.student.id}`, {
          params: { classId },
        });
        setRecords(res.data.data);
        setEnrollments([]);
        setStatusByStudent({});
      }
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to fetch attendance."
          : "Failed to fetch attendance."
      );
    } finally {
      setLoading(false);
    }
  }, [canRecord, classId, date, user?.student?.id]);

  useEffect(() => {
    void fetchAttendance();
  }, [fetchAttendance]);

  const totals = useMemo(() => {
    const source = canRecord ? Object.values(statusByStudent) : records.map((record) => record.status);
    return source.reduce(
      (acc, status) => {
        acc[status] += 1;
        return acc;
      },
      { PRESENT: 0, LATE: 0, ABSENT: 0 } as Record<AttendanceStatus, number>
    );
  }, [canRecord, records, statusByStudent]);

  const saveAttendance = async () => {
    if (!classId || enrollments.length === 0) return;

    try {
      setSaving(true);
      setError(null);
      const res = await api.post("/attendance", {
        class_id: Number(classId),
        date,
        records: enrollments.map((enrollment) => ({
          student_id: enrollment.student_id,
          status: statusByStudent[enrollment.student_id] || "PRESENT",
        })),
      });
      setRecords(res.data.data);
      await fetchAttendance();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to save attendance."
          : "Failed to save attendance."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
        <p className="mt-1 text-surface-600">
          {canRecord ? "Record daily attendance by class." : "Review your attendance history."}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary-600" />
            Class Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="attendance-class">Class</Label>
              <Select
                id="attendance-class"
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
              >
                <option value="">Select class</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </Select>
            </div>
            {canRecord && (
              <div className="space-y-2">
                <Label htmlFor="attendance-date">Date</Label>
                <Input
                  id="attendance-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Present</p>
              <p className="text-2xl font-bold text-emerald-800">{totals.PRESENT}</p>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Late</p>
              <p className="text-2xl font-bold text-amber-800">{totals.LATE}</p>
            </div>
            <div className="rounded-md border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-rose-700">Absent</p>
              <p className="text-2xl font-bold text-rose-800">{totals.ABSENT}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="h-64 w-full animate-pulse rounded-lg bg-surface-200" />
      ) : canRecord ? (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-surface-600">
                    No students enrolled in this class.
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">{enrollment.student.user.name}</TableCell>
                    <TableCell>{enrollment.student.user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {(["PRESENT", "LATE", "ABSENT"] as AttendanceStatus[]).map((status) => (
                          <StatusButton
                            key={status}
                            status={status}
                            active={(statusByStudent[enrollment.student_id] || "PRESENT") === status}
                            onClick={() =>
                              setStatusByStudent((current) => ({
                                ...current,
                                [enrollment.student_id]: status,
                              }))
                            }
                          />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex justify-end">
            <Button className="gap-2" disabled={saving || enrollments.length === 0} onClick={saveAttendance}>
              <Save className="h-4 w-4" />
              Save Attendance
            </Button>
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-surface-600">
                  No attendance records found.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell>{record.class?.name || "Class"}</TableCell>
                  <TableCell>
                    <Badge tone={statusMeta[record.status].tone}>{statusMeta[record.status].label}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
