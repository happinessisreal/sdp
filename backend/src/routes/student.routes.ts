import { Hono } from "hono";
import { studentService } from "../services/student.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { updateStudentSchema } from "../validators/student.validator.js";
import { successResponse, paginatedResponse } from "../middleware/error.middleware.js";
import type { AppVariables } from "../types/index.js";

const students = new Hono<AppVariables>();

// All routes require authentication
students.use("*", authMiddleware);

// GET /api/students
students.get("/", requireRole("ADMIN", "TEACHER"), async (c) => {
  const page = Number(c.req.query("page")) || 1;
  const limit = Number(c.req.query("limit")) || 20;
  const search = c.req.query("search");

  const result = await studentService.list({ page, limit, search });
  return paginatedResponse(c, result.students, {
    page: result.page, limit: result.limit, total: result.total,
  });
});

// GET /api/students/:id
students.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const student = await studentService.getById(id);
  return successResponse(c, student);
});

// PUT /api/students/:id
students.put("/:id", requireRole("ADMIN", "TEACHER"), async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const data = updateStudentSchema.parse(body);
  const student = await studentService.update(id, data);
  return successResponse(c, student, "Student updated");
});

// DELETE /api/students/:id
students.delete("/:id", requireRole("ADMIN"), async (c) => {
  const id = Number(c.req.param("id"));
  const result = await studentService.delete(id);
  return successResponse(c, result);
});

export default students;
