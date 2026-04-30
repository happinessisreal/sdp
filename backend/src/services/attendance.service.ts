import { prisma } from "../db/index.js";
import { NotFoundError } from "../utils/errors.js";
import type { RecordAttendanceInput } from "../validators/attendance.validator.js";

export class AttendanceService {
  async record(data: RecordAttendanceInput) {
    const cls = await prisma.class.findUnique({ where: { id: data.class_id } });
    if (!cls) throw new NotFoundError("Class");

    const date = new Date(data.date);

    // Delete existing records for this class+date to allow re-recording
    await prisma.attendance.deleteMany({
      where: { class_id: data.class_id, date },
    });

    const created = await prisma.$transaction(
      data.records.map((record) =>
        prisma.attendance.create({
          data: {
            student_id: record.student_id,
            class_id: data.class_id,
            date,
            status: record.status,
          },
          include: {
            student: { include: { user: { select: { name: true } } } },
          },
        })
      )
    );

    return created;
  }

  async getByClassAndDate(classId: number, date: string) {
    return prisma.attendance.findMany({
      where: { class_id: classId, date: new Date(date) },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { student: { user: { name: "asc" } } },
    });
  }

  async getByStudent(studentId: number, params: { classId?: number | undefined; from?: string | undefined; to?: string | undefined }) {
    const where: any = { student_id: studentId };
    if (params.classId) where.class_id = params.classId;
    if (params.from || params.to) {
      where.date = {};
      if (params.from) where.date.gte = new Date(params.from);
      if (params.to) where.date.lte = new Date(params.to);
    }

    return prisma.attendance.findMany({
      where,
      include: { class: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    });
  }

  async update(id: number, status: string) {
    const record = await prisma.attendance.findUnique({ where: { id } });
    if (!record) throw new NotFoundError("Attendance record");

    return prisma.attendance.update({
      where: { id },
      data: { status },
      include: {
        student: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
    });
  }
}

export const attendanceService = new AttendanceService();
