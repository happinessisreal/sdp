import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Users, GraduationCap, CalendarDays, DollarSign, Clock } from "lucide-react";

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
  };
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
          <StatCard title="Total Students" value={data.stats.totalStudents} icon={Users} colorClass="bg-blue-100 text-blue-700" />
          <StatCard title="Total Teachers" value={data.stats.totalTeachers} icon={GraduationCap} colorClass="bg-purple-100 text-purple-700" />
          <StatCard title="Total Classes" value={data.stats.totalClasses} icon={CalendarDays} colorClass="bg-green-100 text-green-700" />
          <StatCard title="Revenue" value={`$${data.stats.totalRevenue}`} icon={DollarSign} colorClass="bg-emerald-100 text-emerald-700" />
        </div>
      )}

      {user?.role === "TEACHER" && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="My Classes" value={data.stats.totalClasses} icon={CalendarDays} colorClass="bg-blue-100 text-blue-700" />
          <StatCard title="Total Students" value={data.stats.totalStudents} icon={Users} colorClass="bg-purple-100 text-purple-700" />
          <StatCard title="Total Earnings" value={`$${data.stats.totalRevenue}`} icon={DollarSign} colorClass="bg-emerald-100 text-emerald-700" />
          <StatCard title="Pending Payments" value={data.stats.pendingPayments} icon={Clock} colorClass="bg-amber-100 text-amber-700" />
        </div>
      )}

      {user?.role === "STUDENT" && data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Enrolled Classes" value={data.stats.enrolledClasses} icon={CalendarDays} colorClass="bg-blue-100 text-blue-700" />
          <StatCard title="Attendance Rate" value={`${data.stats.attendanceRate}%`} icon={Users} colorClass="bg-emerald-100 text-emerald-700" />
          <StatCard title="Pending Fees" value={data.stats.pendingPayments} icon={DollarSign} colorClass="bg-amber-100 text-amber-700" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-surface-600 text-sm text-center py-8">
              More detailed charts and lists will appear here.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
