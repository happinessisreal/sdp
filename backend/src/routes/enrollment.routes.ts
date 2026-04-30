import { Hono } from "hono";
import { enrollmentService } from "../services/enrollment.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { successResponse } from "../middleware/error.middleware.js";

const enrollments = new Hono();

enrollments.use("*", authMiddleware);

// POST /api/enrollments
enrollments.post("/", requireRole("ADMIN", "TEACHER"), async (c) => {
  const { student_id, class_id } = await c.req.json();
  const enrollment = await enrollmentService.enroll(student_id, class_id);
  return successResponse(c, enrollment, "Student enrolled", 201);
});

// DELETE /api/enrollments/:id
enrollments.delete("/:id", requireRole("ADMIN", "TEACHER"), async (c) => {
  const id = Number(c.req.param("id"));
  const result = await enrollmentService.remove(id);
  return successResponse(c, result);
});

export default enrollments;
