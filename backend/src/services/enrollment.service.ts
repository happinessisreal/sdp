import { prisma } from "../db/index.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";

export class EnrollmentService {
  /**
   * Enroll a student in a class.
   */
  async enroll(studentId: number, classId: number) {
    // Verify both exist
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundError("Student");

    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw new NotFoundError("Class");

    // Check for duplicate enrollment
    const existing = await prisma.enrollment.findUnique({
      where: {
        student_id_class_id: { student_id: studentId, class_id: classId },
      },
    });

    if (existing) {
      throw new ConflictError("Student is already enrolled in this class");
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        student_id: studentId,
        class_id: classId,
      },
      include: {
        student: {
          include: { user: { select: { name: true, email: true } } },
        },
        class: { select: { id: true, name: true } },
      },
    });

    return enrollment;
  }

  /**
   * Remove an enrollment.
   */
  async remove(id: number) {
    const enrollment = await prisma.enrollment.findUnique({ where: { id } });
    if (!enrollment) throw new NotFoundError("Enrollment");

    await prisma.enrollment.delete({ where: { id } });
    return { message: "Enrollment removed successfully" };
  }

  /**
   * List students enrolled in a specific class.
   */
  async getStudentsByClass(classId: number) {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw new NotFoundError("Class");

    const enrollments = await prisma.enrollment.findMany({
      where: { class_id: classId },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { enrolled_at: "desc" },
    });

    return enrollments;
  }

  /**
   * List classes a student is enrolled in.
   */
  async getClassesByStudent(studentId: number) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundError("Student");

    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId },
      include: {
        class: {
          include: {
            teacher: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
    });

    return enrollments;
  }
}

export const enrollmentService = new EnrollmentService();
