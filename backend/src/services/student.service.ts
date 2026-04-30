import { prisma } from "../db/index.js";
import { NotFoundError } from "../utils/errors.js";

export class StudentService {
  /**
   * List all students with pagination and optional search.
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

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              created_at: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              attendances: true,
              payments: true,
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.student.count({ where }),
    ]);

    return { students, total, page, limit };
  }

  /**
   * Get a single student with detailed information.
   */
  async getById(id: number) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            created_at: true,
          },
        },
        enrollments: {
          include: {
            class: {
              include: {
                teacher: {
                  include: {
                    user: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            attendances: true,
            payments: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError("Student");
    }

    return student;
  }

  /**
   * Get student by user ID (for getting the student profile of a logged-in user).
   */
  async getByUserId(userId: number) {
    const student = await prisma.student.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, created_at: true },
        },
        enrollments: {
          include: {
            class: {
              include: {
                teacher: {
                  include: { user: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError("Student");
    }

    return student;
  }

  /**
   * Update a student's information.
   */
  async update(id: number, data: { name?: string | undefined; enrollment_date?: string | undefined }) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundError("Student");

    // Update user name if provided
    if (data.name) {
      await prisma.user.update({
        where: { id: student.user_id },
        data: { name: data.name },
      });
    }

    // Update student-specific fields
    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(data.enrollment_date && {
          enrollment_date: new Date(data.enrollment_date),
        }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, created_at: true },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a student and their associated user account.
   */
  async delete(id: number) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundError("Student");

    // Cascade delete: remove user (which cascades to student)
    await prisma.user.delete({
      where: { id: student.user_id },
    });

    return { message: "Student deleted successfully" };
  }
}

export const studentService = new StudentService();
