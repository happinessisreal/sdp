import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { errorHandler } from "./middleware/error.middleware.js";
import { AppError } from "./utils/errors.js";
import { ZodError } from "zod/v4";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import classRoutes from "./routes/class.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

// ─── App Setup ───────────────────────────────────────────────────

const app = new Hono();

// ─── Global Middleware ───────────────────────────────────────────

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// ─── Health Check ────────────────────────────────────────────────

app.get("/", (c) => {
  return c.json({
    name: "Tuition Track API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ──────────────────────────────────────────────────

app.route("/api/auth", authRoutes);
app.route("/api/students", studentRoutes);
app.route("/api/teachers", teacherRoutes);
app.route("/api/classes", classRoutes);
app.route("/api/enrollments", enrollmentRoutes);
app.route("/api/attendance", attendanceRoutes);
app.route("/api/payments", paymentRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/notifications", notificationRoutes);

// ─── Global Error Handler ────────────────────────────────────────

app.onError((err, c) => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return c.json({ success: false, message: "Validation failed", errors }, 400);
  }

  return errorHandler(err, c);
});

// ─── 404 Handler ─────────────────────────────────────────────────

app.notFound((c) => {
  return c.json({ success: false, message: "Route not found" }, 404);
});

// ─── Export ──────────────────────────────────────────────────────

export default {
  port: parseInt(process.env.PORT || "3000"),
  fetch: app.fetch,
};
