import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
import { formatCurrency, formatDate, todayInputValue } from "@/lib/format";
import type { ClassItem, Enrollment, Payment, PaymentStatus, PaymentSummary } from "@/types/api";
import { CheckCircle2, Clock3, CreditCard, Plus, ReceiptText, XCircle } from "lucide-react";

const paymentMeta: Record<PaymentStatus, { label: string; tone: "green" | "amber" | "red"; icon: typeof CheckCircle2 }> = {
  PAID: { label: "Paid", tone: "green", icon: CheckCircle2 },
  PENDING: { label: "Pending", tone: "amber", icon: Clock3 },
  OVERDUE: { label: "Overdue", tone: "red", icon: XCircle },
};

const emptyPaymentForm = {
  class_id: "",
  student_id: "",
  amount: "5000",
  due_date: todayInputValue(),
  status: "PENDING" as PaymentStatus,
};

export function Payments() {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "TEACHER";
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classStudents, setClassStudents] = useState<Enrollment[]>([]);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [form, setForm] = useState(emptyPaymentForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments", {
        params: { status: statusFilter || undefined },
      });
      setPayments(res.data.data);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to fetch payments."
          : "Failed to fetch payments."
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchSummary = useCallback(async () => {
    if (!canManage) return;

    try {
      const res = await api.get("/payments/summary");
      setSummary(res.data.data);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to fetch payment summary."
          : "Failed to fetch payment summary."
      );
    }
  }, [canManage]);

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
    void fetchSummary();
  }, [fetchClasses, fetchSummary]);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (!canManage || !form.class_id) {
      setClassStudents([]);
      return;
    }

    api
      .get(`/classes/${form.class_id}/students`)
      .then((res) => {
        setClassStudents(res.data.data);
      })
      .catch((err) => {
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.message || "Failed to fetch enrolled students."
            : "Failed to fetch enrolled students."
        );
      });
  }, [canManage, form.class_id]);

  const createPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await api.post("/payments", {
        class_id: Number(form.class_id),
        student_id: Number(form.student_id),
        amount: Number(form.amount),
        due_date: form.due_date,
        status: form.status,
        payment_date: form.status === "PAID" ? todayInputValue() : undefined,
      });
      setForm(emptyPaymentForm);
      await Promise.all([fetchPayments(), fetchSummary()]);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to create payment."
          : "Failed to create payment."
      );
    } finally {
      setSaving(false);
    }
  };

  const updatePaymentStatus = async (payment: Payment, status: PaymentStatus) => {
    try {
      setSaving(true);
      setError(null);
      await api.put(`/payments/${payment.id}`, { status });
      await Promise.all([fetchPayments(), fetchSummary()]);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to update payment."
          : "Failed to update payment."
      );
    } finally {
      setSaving(false);
    }
  };

  const visibleTotals = useMemo(() => {
    if (summary) return summary;

    return payments.reduce<PaymentSummary>(
      (acc, payment) => {
        const key = payment.status.toLowerCase() as "paid" | "pending" | "overdue";
        acc[key].count += 1;
        acc[key].total += payment.amount;
        return acc;
      },
      {
        paid: { count: 0, total: 0 },
        pending: { count: 0, total: 0 },
        overdue: { count: 0, total: 0 },
        recentPayments: [],
      }
    );
  }, [payments, summary]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{user?.role === "STUDENT" ? "Fees" : "Payments"}</h2>
          <p className="mt-1 text-surface-600">Track tuition fees, due dates, and payment history.</p>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as PaymentStatus | "")}
          >
            <option value="">All payments</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-emerald-50 p-3 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Paid</p>
                <p className="text-xl font-bold">{formatCurrency(visibleTotals.paid.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-amber-50 p-3 text-amber-700">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Pending</p>
                <p className="text-xl font-bold">{formatCurrency(visibleTotals.pending.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-rose-50 p-3 text-rose-700">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Overdue</p>
                <p className="text-xl font-bold">{formatCurrency(visibleTotals.overdue.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary-600" />
              Add Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-6" onSubmit={createPayment}>
              <div className="space-y-2 xl:col-span-2">
                <Label htmlFor="payment-class">Class</Label>
                <Select
                  id="payment-class"
                  value={form.class_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      class_id: event.target.value,
                      student_id: "",
                    }))
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
              <div className="space-y-2 xl:col-span-2">
                <Label htmlFor="payment-student">Student</Label>
                <Select
                  id="payment-student"
                  value={form.student_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, student_id: event.target.value }))
                  }
                  required
                  disabled={!form.class_id}
                >
                  <option value="">Select student</option>
                  {classStudents.map((enrollment) => (
                    <option key={enrollment.id} value={enrollment.student_id}>
                      {enrollment.student.user.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min={1}
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-due">Due Date</Label>
                <Input
                  id="payment-due"
                  type="date"
                  value={form.due_date}
                  onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-status">Status</Label>
                <Select
                  id="payment-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value as PaymentStatus }))
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full gap-2" disabled={saving || classStudents.length === 0}>
                  <Plus className="h-4 w-4" />
                  Add Payment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="h-64 w-full animate-pulse rounded-lg bg-surface-200" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="h-24 text-center text-surface-600">
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => {
                const meta = paymentMeta[payment.status];
                const StatusIcon = meta.icon;

                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.student.user.name}</TableCell>
                    <TableCell>{payment.class.name}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{formatDate(payment.due_date)}</TableCell>
                    <TableCell>
                      <Badge tone={meta.tone} className="gap-1">
                        <StatusIcon className="h-3.5 w-3.5" />
                        {meta.label}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {(["PAID", "PENDING", "OVERDUE"] as PaymentStatus[]).map((status) => (
                            <Button
                              key={status}
                              size="icon"
                              variant={payment.status === status ? "default" : "outline"}
                              title={`Mark ${paymentMeta[status].label}`}
                              disabled={saving}
                              onClick={() => void updatePaymentStatus(payment, status)}
                            >
                              {status === "PAID" && <CheckCircle2 className="h-4 w-4" />}
                              {status === "PENDING" && <ReceiptText className="h-4 w-4" />}
                              {status === "OVERDUE" && <XCircle className="h-4 w-4" />}
                            </Button>
                          ))}
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
