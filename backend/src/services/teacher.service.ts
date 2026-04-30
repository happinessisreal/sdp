import { prisma } from "../db/index.js";
import { NotFoundError } from "../utils/errors.js";

export class TeacherService {
  /**
   * List all teachers.
   */
  async list(params: { page?: number; limit?: number; search?: string | undefined }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where = params.search
      ? {
          user: {
            OR: [
              { name: { contains: params.search } },
              { email: { contains: params.search } },
            ],
          },
        }
      : {};

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, created_at: true },
          },
          _count: {
            select: { classes: true, payments: true },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.teacher.count({ where }),
    ]);

    return { teachers, total, page, limit };
  }

  /**
   * Get a single teacher with their classes.
   */
  async getById(id: number) {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, created_at: true },
        },
        classes: {
          include: {
            _count: { select: { enrollments: true } },
          },
        },
      },
    });

    if (!teacher) throw new NotFoundError("Teacher");
    return teacher;
  }

  /**
   * Get teacher by user ID.
   */
  async getByUserId(userId: number) {
    const teacher = await prisma.teacher.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, created_at: true },
        },
        classes: {
          include: {
            _count: { select: { enrollments: true } },
          },
        },
      },
    });

    if (!teacher) throw new NotFoundError("Teacher");
    return teacher;
  }
}

export const teacherService = new TeacherService();
