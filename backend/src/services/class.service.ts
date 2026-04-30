import { prisma } from "../db/index.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type { CreateClassInput, UpdateClassInput } from "../validators/class.validator.js";

export class ClassService {
  /**
   * Create a new class for a teacher.
   */
  async create(teacherUserId: number, data: CreateClassInput) {
    const teacher = await prisma.teacher.findUnique({
      where: { user_id: teacherUserId },
    });

    if (!teacher) throw new NotFoundError("Teacher profile");

    const newClass = await prisma.class.create({
      data: {
        teacher_id: teacher.id,
        name: data.name,
        date: data.date ? new Date(data.date) : null,
        start_time: data.start_time || null,
        number_of_days_a_week: data.number_of_days_a_week || null,
      },
      include: {
        teacher: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return newClass;
  }

  /**
   * List classes with optional filtering.
   */
  async list(params: {
    page?: number;
    limit?: number;
    search?: string | undefined;
    teacherId?: number | undefined;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.teacherId) {
      where.teacher_id = params.teacherId;
    }

    if (params.search) {
      where.name = { contains: params.search };
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take: limit,
        include: {
          teacher: {
            include: { user: { select: { name: true } } },
          },
          _count: {
            select: { enrollments: true, attendances: true },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.class.count({ where }),
    ]);

    return { classes, total, page, limit };
  }

  /**
   * Get a class with full details including enrolled students.
   */
  async getById(id: number) {
    const cls = await prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          include: { user: { select: { name: true, email: true } } },
        },
        enrollments: {
          include: {
            student: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
        _count: {
          select: { attendances: true, payments: true },
        },
      },
    });

    if (!cls) throw new NotFoundError("Class");
    return cls;
  }

  /**
   * Update a class. Only the owning teacher or an admin can update.
   */
  async update(id: number, data: UpdateClassInput, userId: number, userRole: string) {
    const cls = await prisma.class.findUnique({
      where: { id },
      include: { teacher: true },
    });

    if (!cls) throw new NotFoundError("Class");

    // Only admin or the owning teacher can update
    if (userRole !== "ADMIN" && cls.teacher.user_id !== userId) {
      throw new ForbiddenError("You can only update your own classes");
    }

    const updated = await prisma.class.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.date !== undefined && {
          date: data.date ? new Date(data.date) : null,
        }),
        ...(data.start_time !== undefined && {
          start_time: data.start_time || null,
        }),
        ...(data.number_of_days_a_week !== undefined && {
          number_of_days_a_week: data.number_of_days_a_week || null,
        }),
      },
      include: {
        teacher: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a class.
   */
  async delete(id: number, userId: number, userRole: string) {
    const cls = await prisma.class.findUnique({
      where: { id },
      include: { teacher: true },
    });

    if (!cls) throw new NotFoundError("Class");

    if (userRole !== "ADMIN" && cls.teacher.user_id !== userId) {
      throw new ForbiddenError("You can only delete your own classes");
    }

    await prisma.class.delete({ where: { id } });
    return { message: "Class deleted successfully" };
  }
}

export const classService = new ClassService();
