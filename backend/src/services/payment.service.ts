import { prisma } from "../db/index.js";
import { NotFoundError } from "../utils/errors.js";
import type { CreatePaymentInput, UpdatePaymentInput } from "../validators/payment.validator.js";

export class PaymentService {
  async create(data: CreatePaymentInput, teacherId: number) {
    const student = await prisma.student.findUnique({ where: { id: data.student_id } });
    if (!student) throw new NotFoundError("Student");

    const cls = await prisma.class.findUnique({ where: { id: data.class_id } });
    if (!cls) throw new NotFoundError("Class");

    return prisma.payment.create({
      data: {
        student_id: data.student_id,
        teacher_id: teacherId,
        class_id: data.class_id,
        amount: data.amount,
        status: data.status || "PENDING",
        due_date: new Date(data.due_date),
        payment_date: data.payment_date ? new Date(data.payment_date) : null,
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
    });
  }

  async list(params: {
    page?: number; limit?: number;
    studentId?: number | undefined; classId?: number | undefined; status?: string | undefined; teacherId?: number | undefined;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (params.studentId) where.student_id = params.studentId;
    if (params.classId) where.class_id = params.classId;
    if (params.status) where.status = params.status;
    if (params.teacherId) where.teacher_id = params.teacherId;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where, skip, take: limit,
        include: {
          student: { include: { user: { select: { name: true, email: true } } } },
          class: { select: { id: true, name: true } },
          teacher: { include: { user: { select: { name: true } } } },
        },
        orderBy: { id: "desc" },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total, page, limit };
  }

  async update(id: number, data: UpdatePaymentInput) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundError("Payment");

    return prisma.payment.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.status && { status: data.status }),
        ...(data.due_date && { due_date: new Date(data.due_date) }),
        ...(data.payment_date !== undefined && {
          payment_date: data.payment_date ? new Date(data.payment_date) : null,
        }),
        // Auto-set payment_date when marking as paid
        ...(data.status === "PAID" && !data.payment_date && {
          payment_date: new Date(),
        }),
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
    });
  }

  async getSummary(teacherId?: number) {
    const where: any = teacherId ? { teacher_id: teacherId } : {};

    const [totalPaid, totalPending, totalOverdue, recentPayments] = await Promise.all([
      prisma.payment.aggregate({ where: { ...where, status: "PAID" }, _sum: { amount: true }, _count: true }),
      prisma.payment.aggregate({ where: { ...where, status: "PENDING" }, _sum: { amount: true }, _count: true }),
      prisma.payment.aggregate({ where: { ...where, status: "OVERDUE" }, _sum: { amount: true }, _count: true }),
      prisma.payment.findMany({
        where, take: 5, orderBy: { id: "desc" },
        include: {
          student: { include: { user: { select: { name: true } } } },
          class: { select: { name: true } },
        },
      }),
    ]);

    return {
      paid: { count: totalPaid._count, total: totalPaid._sum.amount || 0 },
      pending: { count: totalPending._count, total: totalPending._sum.amount || 0 },
      overdue: { count: totalOverdue._count, total: totalOverdue._sum.amount || 0 },
      recentPayments,
    };
  }

  async getByStudent(studentId: number) {
    return prisma.payment.findMany({
      where: { student_id: studentId },
      include: {
        class: { select: { id: true, name: true } },
        teacher: { include: { user: { select: { name: true } } } },
      },
      orderBy: { due_date: "desc" },
    });
  }
}

export const paymentService = new PaymentService();
