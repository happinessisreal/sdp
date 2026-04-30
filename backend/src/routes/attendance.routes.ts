import { Hono } from "hono";
import { attendanceService } from "../services/attendance.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { recordAttendanceSchema, updateAttendanceSchema } from "../validators/attendance.validator.js";
import { successResponse } from "../middleware/error.middleware.js";
import type { AppVariables } from "../types/index.js";

const attendance = new Hono<AppVariables>();

attendance.use("*", authMiddleware);

// POST /api/attendance — batch record
attendance.post("/", requireRole("ADMIN", "TEACHER"), async (c) => {
  const body = await c.req.json();
  const data = recordAttendanceSchema.parse(body);
  const records = await attendanceService.record(data);
  return successResponse(c, records, "Attendance recorded", 201);
});

// GET /api/attendance?classId=&date=
attendance.get("/", async (c) => {
  const classId = Number(c.req.query("classId"));
  const date = c.req.query("date") || new Date().toISOString().split("T")[0]!;
  const records = await attendanceService.getByClassAndDate(classId, date);
  return successResponse(c, records);
});

// PUT /api/attendance/:id
attendance.put("/:id", requireRole("ADMIN", "TEACHER"), async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const { status } = updateAttendanceSchema.parse(body);
  const record = await attendanceService.update(id, status);
  return successResponse(c, record, "Attendance updated");
});

// GET /api/attendance/student/:studentId
attendance.get("/student/:studentId", async (c) => {
  const studentId = Number(c.req.param("studentId"));
  const classIdParam = c.req.query("classId");
  const classId = classIdParam ? Number(classIdParam) : undefined;
  const from = c.req.query("from");
  const to = c.req.query("to");

  const records = await attendanceService.getByStudent(studentId, { classId, from, to });
  return successResponse(c, records);
});

export default attendance;
