import { Hono } from "hono";
import { classService } from "../services/class.service.js";
import { enrollmentService } from "../services/enrollment.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { createClassSchema, updateClassSchema } from "../validators/class.validator.js";
import { successResponse, paginatedResponse } from "../middleware/error.middleware.js";
import type { AppVariables } from "../types/index.js";

const classes = new Hono<AppVariables>();

classes.use("*", authMiddleware);

// POST /api/classes
classes.post("/", requireRole("ADMIN", "TEACHER"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const data = createClassSchema.parse(body);
  const cls = await classService.create(user.userId, data);
  return successResponse(c, cls, "Class created", 201);
});

// GET /api/classes
classes.get("/", async (c) => {
  const page = Number(c.req.query("page")) || 1;
  const limit = Number(c.req.query("limit")) || 20;
  const search = c.req.query("search");
  const teacherIdParam = c.req.query("teacherId");
  const teacherId = teacherIdParam ? Number(teacherIdParam) : undefined;

  const result = await classService.list({ page, limit, search, teacherId });
  return paginatedResponse(c, result.classes, {
    page: result.page, limit: result.limit, total: result.total,
  });
});

// GET /api/classes/:id
classes.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const cls = await classService.getById(id);
  return successResponse(c, cls);
});

// PUT /api/classes/:id
classes.put("/:id", requireRole("ADMIN", "TEACHER"), async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const data = updateClassSchema.parse(body);
  const cls = await classService.update(id, data, user.userId, user.role);
  return successResponse(c, cls, "Class updated");
});

// DELETE /api/classes/:id
classes.delete("/:id", requireRole("ADMIN", "TEACHER"), async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  const result = await classService.delete(id, user.userId, user.role);
  return successResponse(c, result);
});

// GET /api/classes/:id/students
classes.get("/:id/students", async (c) => {
  const classId = Number(c.req.param("id"));
  const enrollments = await enrollmentService.getStudentsByClass(classId);
  return successResponse(c, enrollments);
});

export default classes;
