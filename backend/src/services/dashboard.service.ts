import { prisma } from "../db/index.js";

export class DashboardService {
  async getAdminDashboard() {
    const [studentCount, teacherCount, classCount, paymentSummary, recentStudents] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.payment.aggregate({ _sum: { amount: true }, _count: true, where: { status: "PAID" } }),
      prisma.student.findMany({
        take: 5, orderBy: { id: "desc" },
        include: { user: { select: { name: true, email: true, created_at: true } } },
      }),
    ]);

    const pendingPayments = await prisma.payment.count({ where: { status: "PENDING" } });
    const overduePayments = await prisma.payment.count({ where: { status: "OVERDUE" } });

    return {
      stats: {
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalClasses: classCount,
        totalRevenue: paymentSummary._sum.amount || 0,
        pendingPayments,
        overduePayments,
      },
      recentStudents,
    };
  }

  async getTeacherDashboard(userId: number) {
    const teacher = await prisma.teacher.findUnique({ where: { user_id: userId } });
    if (!teacher) return null;

    const [classes, studentCount, paymentSummary, pendingCount] = await Promise.all([
      prisma.class.findMany({
        where: { teacher_id: teacher.id },
        include: { _count: { select: { enrollments: true } } },
      }),
      prisma.enrollment.count({ where: { class: { teacher_id: teacher.id } } }),
      prisma.payment.aggregate({
        where: { teacher_id: teacher.id, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { teacher_id: teacher.id, status: "PENDING" } }),
    ]);

    return {
      stats: {
        totalClasses: classes.length,
        totalStudents: studentCount,
        totalRevenue: paymentSummary._sum.amount || 0,
        pendingPayments: pendingCount,
      },
      classes,
    };
  }

  async getStudentDashboard(userId: number) {
    const student = await prisma.student.findUnique({ where: { user_id: userId } });
    if (!student) return null;

    const [enrollments, attendanceCount, presentCount, payments] = await Promise.all([
      prisma.enrollment.findMany({
        where: { student_id: student.id },
        include: {
          class: { include: { teacher: { include: { user: { select: { name: true } } } } } },
        },
      }),
      prisma.attendance.count({ where: { student_id: student.id } }),
      prisma.attendance.count({ where: { student_id: student.id, status: "PRESENT" } }),
      prisma.payment.findMany({
        where: { student_id: student.id, status: "PENDING" },
        include: { class: { select: { name: true } } },
        orderBy: { due_date: "asc" },
        take: 5,
      }),
    ]);

    return {
      stats: {
        enrolledClasses: enrollments.length,
        attendanceRate: attendanceCount > 0 ? Math.round((presentCount / attendanceCount) * 100) : 0,
        pendingPayments: payments.length,
      },
      enrollments,
      upcomingPayments: payments,
    };
  }
}

export const dashboardService = new DashboardService();
