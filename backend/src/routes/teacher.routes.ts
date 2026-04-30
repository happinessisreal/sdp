import { Hono } from "hono";
import { teacherService } from "../services/teacher.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { successResponse, paginatedResponse } from "../middleware/error.middleware.js";
import type { AppVariables } from "../types/index.js";

const teachers = new Hono<AppVariables>();

teachers.use("*", authMiddleware);

// GET /api/teachers
teachers.get("/", requireRole("ADMIN"), async (c) => {
  const page = Number(c.req.query("page")) || 1;
  const limit = Number(c.req.query("limit")) || 20;
  const search = c.req.query("search");

  const result = await teacherService.list({ page, limit, search });
  return paginatedResponse(c, result.teachers, {
    page: result.page, limit: result.limit, total: result.total,
  });
});

// GET /api/teachers/:id
teachers.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const teacher = await teacherService.getById(id);
  return successResponse(c, teacher);
});

export default teachers;
