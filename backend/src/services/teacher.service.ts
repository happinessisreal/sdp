import { prisma } from "../db/index.js";
import { hashPassword } from "../utils/password.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import type { CreateTeacherInput, UpdateTeacherInput } from "../validators/teacher.validator.js";

export class TeacherService {
  async create(data: CreateTeacherInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }

    const hashedPassword = await hashPassword(data.password);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "TEACHER",
        teacher: { create: {} },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        teacher: {
          include: {
            _count: {
              select: { classes: true, payments: true },
            },
          },
        },
      },
    });
  }

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

  async update(id: number, data: UpdateTeacherInput) {
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new NotFoundError("Teacher");

    if (data.name) {
      await prisma.user.update({
        where: { id: teacher.user_id },
        data: { name: data.name },
      });
    }

    return prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, created_at: true },
        },
        _count: {
          select: { classes: true, payments: true },
        },
      },
    });
  }

  async delete(id: number) {
    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) throw new NotFoundError("Teacher");

    await prisma.user.delete({
      where: { id: teacher.user_id },
    });

    return { message: "Teacher deleted successfully" };
  }
}

export const teacherService = new TeacherService();
