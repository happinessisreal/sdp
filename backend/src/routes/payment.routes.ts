import { Hono } from "hono";
import { paymentService } from "../services/payment.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { createPaymentSchema, updatePaymentSchema } from "../validators/payment.validator.js";
import { successResponse, paginatedResponse } from "../middleware/error.middleware.js";
import { prisma } from "../db/index.js";
import { NotFoundError } from "../utils/errors.js";
import type { AppVariables } from "../types/index.js";

const payments = new Hono<AppVariables>();

payments.use("*", authMiddleware);

// POST /api/payments
payments.post("/", requireRole("ADMIN", "TEACHER"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const data = createPaymentSchema.parse(body);

  const teacher = await prisma.teacher.findUnique({ where: { user_id: user.userId } });
  if (!teacher) throw new NotFoundError("Teacher profile");

  const payment = await paymentService.create(data, teacher.id);
  return successResponse(c, payment, "Payment created", 201);
});

// GET /api/payments
payments.get("/", async (c) => {
  const user = c.get("user");
  const page = Number(c.req.query("page")) || 1;
  const limit = Number(c.req.query("limit")) || 20;
  const studentIdParam = c.req.query("studentId");
  const classIdParam = c.req.query("classId");
  const studentId = studentIdParam ? Number(studentIdParam) : undefined;
  const classId = classIdParam ? Number(classIdParam) : undefined;
  const status = c.req.query("status");

  let teacherId: number | undefined;
  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { user_id: user.userId } });
    teacherId = teacher?.id;
  }

  const result = await paymentService.list({ page, limit, studentId, classId, status, teacherId });
  return paginatedResponse(c, result.payments, {
    page: result.page, limit: result.limit, total: result.total,
  });
});

// GET /api/payments/summary
payments.get("/summary", requireRole("ADMIN", "TEACHER"), async (c) => {
  const user = c.get("user");
  let teacherId: number | undefined;

  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { user_id: user.userId } });
    teacherId = teacher?.id;
  }

  const summary = await paymentService.getSummary(teacherId);
  return successResponse(c, summary);
});

// PUT /api/payments/:id
payments.put("/:id", requireRole("ADMIN", "TEACHER"), async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const data = updatePaymentSchema.parse(body);
  const payment = await paymentService.update(id, data);
  return successResponse(c, payment, "Payment updated");
});

export default payments;
