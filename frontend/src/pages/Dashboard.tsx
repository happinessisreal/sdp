import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ClassItem, Enrollment, Payment, Student } from "@/types/api";
import { Users, GraduationCap, CalendarDays, DollarSign, Clock, BookOpen, ReceiptText } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
}

const StatCard = ({ title, value, icon: Icon, colorClass }: StatCardProps) => (
  <Card>
    <CardContent className="p-6 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-surface-500">{title}</p>
        <h4 className="text-2xl font-bold">{value}</h4>
      </div>
    </CardContent>
  </Card>
);

interface DashboardData {
  stats: {
    totalStudents?: number;
    totalTeachers?: number;
    totalClasses?: number;
    totalRevenue?: number;
    pendingPayments?: number;
    enrolledClasses?: number;
    attendanceRate?: number;
    overduePayments?: number;
  };
  recentStudents?: Student[];
  classes?: ClassItem[];
  enrollments?: Enrollment[];
  upcomingPayments?: Payment[];
}

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard");
        setData(res.data.data);
      } catch (error) {
        console.error("Failed to fetch dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-surface-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-surface-200 rounded-xl"></div>)}
      </div>
    </div>;
  }



  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-surface-600 mt-1">Welcome back, {user?.name}</p>
      </div>

      {user?.role === "ADMIN" && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Students" value={data.stats.totalStudents ?? 0} icon={Users} colorClass="bg-blue-100 text-blue-700" />
          <StatCard title="Total Teachers" value={data.stats.totalTeachers ?? 0} icon={GraduationCap} colorClass="bg-purple-100 text-purple-700" />
          <StatCard title="Total Classes" value={data.stats.totalClasses ?? 0} icon={CalendarDays} colorClass="bg-green-100 text-green-700" />
          <StatCard title="Revenue" value={formatCurrency(data.stats.totalRevenue)} icon={DollarSign} colorClass="bg-emerald-100 text-emerald-700" />
        </div>
      )}

      {user?.role === "TEACHER" && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="My Classes" value={data.stats.totalClasses ?? 0} icon={CalendarDays} colorClass="bg-blue-100 text-blue-700" />
          <StatCard title="Total Students" value={data.stats.totalStudents ?? 0} icon={Users} colorClass="bg-purple-100 text-purple-700" />
          <StatCard title="Total Earnings" value={formatCurrency(data.stats.totalRevenue)} icon={DollarSign} colorClass="bg-emerald-100 text-emerald-700" />
          <StatCard title="Pending Payments" value={data.stats.pendingPayments ?? 0} icon={Clock} colorClass="bg-amber-100 text-amber-700" />
        </div>
      )}

      {user?.role === "STUDENT" && data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Enrolled Classes" value={data.stats.enrolledClasses ?? 0} icon={CalendarDays} colorClass="bg-blue-100 text-blue-700" />
          <StatCard title="Attendance Rate" value={`${data.stats.attendanceRate ?? 0}%`} icon={Users} colorClass="bg-emerald-100 text-emerald-700" />
          <StatCard title="Pending Fees" value={data.stats.pendingPayments ?? 0} icon={DollarSign} colorClass="bg-amber-100 text-amber-700" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {user?.role === "STUDENT" ? "Upcoming Fees" : user?.role === "TEACHER" ? "My Class Load" : "Recent Students"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user?.role === "ADMIN" && (
              <div className="space-y-3">
                {(data?.recentStudents || []).map((student) => (
                  <div key={student.id} className="flex items-center justify-between rounded-md border border-surface-200 p-3">
                    <div>
                      <p className="font-medium">{student.user.name}</p>
                      <p className="text-sm text-surface-500">{student.user.email}</p>
                    </div>
                    <Badge tone="blue">{formatDate(student.user.created_at)}</Badge>
                  </div>
                ))}
                {(data?.recentStudents || []).length === 0 && (
                  <p className="py-8 text-center text-sm text-surface-600">No recent students yet.</p>
                )}
              </div>
            )}

            {user?.role === "TEACHER" && (
              <div className="space-y-3">
                {(data?.classes || []).map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between rounded-md border border-surface-200 p-3">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="font-medium">{classItem.name}</p>
                        <p className="text-sm text-surface-500">{classItem.start_time || "No time set"}</p>
                      </div>
                    </div>
                    <Badge tone="green">{classItem._count?.enrollments || 0} students</Badge>
                  </div>
                ))}
                {(data?.classes || []).length === 0 && (
                  <p className="py-8 text-center text-sm text-surface-600">No classes assigned yet.</p>
                )}
              </div>
            )}

            {user?.role === "STUDENT" && (
              <div className="space-y-3">
                {(data?.upcomingPayments || []).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-md border border-surface-200 p-3">
                    <div className="flex items-center gap-3">
                      <ReceiptText className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="font-medium">{payment.class.name}</p>
                        <p className="text-sm text-surface-500">Due {formatDate(payment.due_date)}</p>
                      </div>
                    </div>
                    <Badge tone="amber">{formatCurrency(payment.amount)}</Badge>
                  </div>
                ))}
                {(data?.upcomingPayments || []).length === 0 && (
                  <p className="py-8 text-center text-sm text-surface-600">No pending fees.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
